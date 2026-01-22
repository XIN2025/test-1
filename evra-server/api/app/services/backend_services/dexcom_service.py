import base64
import hashlib
import hmac
import json
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import httpx


from app.config import (
    DEXCOM_CLIENT_ID,
    DEXCOM_CLIENT_SECRET,
    DEXCOM_REDIRECT_URI,
    DEXCOM_AUTH_URL,
    DEXCOM_TOKEN_URL,
    DEXCOM_DATA_URL,
    DEXCOM_DATARANGE_URL,
    SECRET_KEY,
)
from app.services.backend_services.db import get_db
from app.services.backend_services.encryption_service import get_encryption_service


logger = logging.getLogger(__name__)



class DexcomService:
    def __init__(self):
        self.db = get_db()
        self.dexcom_accounts_collection = self.db["dexcom_accounts"]
        self.cgm_readings_collection = self.db["cgm_readings"]
        self.encryption_service = get_encryption_service()
        self.state_ttl_seconds = 600


    def _sign_state(self, payload: Dict[str, Any]) -> str:
        raw = json.dumps(payload, separators=(",", ":")).encode()
        encoded = base64.urlsafe_b64encode(raw).decode()
        signature = hmac.new(
            SECRET_KEY.encode(), encoded.encode(), hashlib.sha256
        ).digest()
        signature_b64 = base64.urlsafe_b64encode(signature).decode()
        return f"{encoded}.{signature_b64}"


    def _verify_state(self, state: str) -> Dict[str, Any]:
        try:
            encoded, signature_b64 = state.split(".", 1)
        except ValueError:
            raise ValueError("Invalid state format")

        expected_sig = hmac.new(
            SECRET_KEY.encode(), encoded.encode(), hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode()
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            raise ValueError("Invalid state signature")

        try:
            raw = base64.urlsafe_b64decode(encoded.encode()).decode()
            payload = json.loads(raw)
        except Exception as e:
            logger.error(f"Failed to decode state payload: {e}")
            raise ValueError("Invalid state payload")

        issued_at = payload.get("iat")
        if not isinstance(issued_at, int):
            raise ValueError("Invalid state timestamp")
        now_ts = int(datetime.now(timezone.utc).timestamp())
        if now_ts - issued_at > self.state_ttl_seconds:
            raise ValueError("State has expired")

        return payload


    def generate_auth_url(self, user_email: str) -> tuple[str, str]:
        state_data = {
            "email": user_email,
            "nonce": secrets.token_urlsafe(16),
            "iat": int(datetime.now(timezone.utc).timestamp()),
        }
        state = self._sign_state(state_data)


        params = {
            "client_id": DEXCOM_CLIENT_ID,
            "redirect_uri": DEXCOM_REDIRECT_URI,
            "response_type": "code",
            "scope": "offline_access",
            "state": state,
        }


        auth_url = f"{DEXCOM_AUTH_URL}?{urlencode(params)}"


        return auth_url, state


    async def exchange_code_for_tokens(
        self, code: str, state: str
    ) -> Dict[str, Any]:
        state_data = self._verify_state(state)
        user_email = state_data.get("email")


        if not user_email:
            raise ValueError("User email not found in state")


        payload = {
            "client_id": DEXCOM_CLIENT_ID,
            "client_secret": DEXCOM_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": DEXCOM_REDIRECT_URI,
        }


        async with httpx.AsyncClient() as client:
            response = await client.post(
                DEXCOM_TOKEN_URL,
                data=payload,
                headers={"content-type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )


            if response.status_code != 200:
                logger.error(f"Dexcom token exchange failed: {response.text}")
                raise Exception(f"Dexcom API error: {response.text}")


            try:
                data = response.json()
                access_token = data.get("access_token")
                refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in", 3600)
            except json.JSONDecodeError:
                raise Exception("Dexcom API error: Invalid JSON response")


            if not access_token or not refresh_token:
                raise Exception("Missing tokens in Dexcom response")


            encrypted_access = self.encryption_service._encrypt_value(access_token)
            encrypted_refresh = self.encryption_service._encrypt_value(refresh_token)


            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)


            account_doc = {
                "user_email": user_email,
                "access_token": encrypted_access,
                "refresh_token": encrypted_refresh,
                "token_expires_at": expires_at,
                "dexcom_user_id": data.get("accountId"),
                "last_sync_time": None,
                "created_at": datetime.now(timezone.utc),
            }


            await self.dexcom_accounts_collection.update_one(
                {"user_email": user_email},
                {"$set": account_doc},
                upsert=True,
            )


            logger.info(f"Dexcom tokens stored for user: {user_email}")
            return {
                "user_email": user_email,
                "dexcom_user_id": data.get("accountId"),
            }


    async def refresh_access_token(self, account: Dict[str, Any]) -> str:
        encrypted_refresh = account.get("refresh_token")
        if not encrypted_refresh:
            raise Exception("No refresh token available")


        refresh_token = self.encryption_service._decrypt_value(encrypted_refresh)


        payload = {
            "client_id": DEXCOM_CLIENT_ID,
            "client_secret": DEXCOM_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "redirect_uri": DEXCOM_REDIRECT_URI,
        }


        async with httpx.AsyncClient() as client:
            response = await client.post(
                DEXCOM_TOKEN_URL,
                data=payload,
                headers={"content-type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )


            if response.status_code != 200:
                logger.error(f"Dexcom token refresh failed: {response.text}")
                raise Exception(f"Dexcom API error: {response.text}")


            try:
                data = response.json()
                new_access_token = data.get("access_token")
                new_refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in", 3600)
            except json.JSONDecodeError:
                raise Exception("Dexcom API error: Invalid JSON response")


            if not new_access_token:
                raise Exception("Missing access token in refresh response")


            encrypted_access = self.encryption_service._encrypt_value(new_access_token)
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)


            update_doc = {
                "access_token": encrypted_access,
                "token_expires_at": expires_at,
            }


            if new_refresh_token:
                encrypted_refresh_new = self.encryption_service._encrypt_value(
                    new_refresh_token
                )
                update_doc["refresh_token"] = encrypted_refresh_new


            await self.dexcom_accounts_collection.update_one(
                {"user_email": account["user_email"]},
                {"$set": update_doc},
            )


            logger.info(f"Access token refreshed for user: {account['user_email']}")
            return new_access_token


    async def get_valid_access_token(self, account: Dict[str, Any]) -> str:
        encrypted_access = account.get("access_token")
        if not encrypted_access:
            raise Exception("No access token found")


        expires_at = account.get("token_expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        elif isinstance(expires_at, datetime):
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)


        now = datetime.now(timezone.utc)
        if expires_at and expires_at <= now + timedelta(minutes=5):
            logger.info("Access token expired, refreshing...")
            return await self.refresh_access_token(account)


        return self.encryption_service._decrypt_value(encrypted_access)


    async def get_data_range(self, access_token: str) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    DEXCOM_DATARANGE_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30.0,
                )


                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(
                        f"DataRange API error: {response.status_code} - {response.text}"
                    )
                    return None
        except Exception as e:
            logger.error(f"Error fetching data range: {e}")
            return None


    async def fetch_egv_data(
        self, access_token: str, start_time: datetime, end_time: datetime
    ) -> list:
        start_utc = start_time.astimezone(timezone.utc)
        end_utc = end_time.astimezone(timezone.utc)
        start_str = start_utc.strftime("%Y-%m-%dT%H:%M:%S")
        end_str = end_utc.strftime("%Y-%m-%dT%H:%M:%S")


        params = {
            "startDate": start_str,
            "endDate": end_str,
        }


        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }


        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    DEXCOM_DATA_URL, headers=headers, params=params, timeout=30.0
                )


                if response.status_code != 200:
                    logger.error(
                        f"EGV API error: {response.status_code} - {response.text}"
                    )
                    return []


                try:
                    data = response.json()
                    
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict):
                        if "records" in data:
                            return data.get("records", [])
                        elif "egvs" in data:
                            return data.get("egvs", [])
                        else:
                            return []
                    else:
                        return []
                except json.JSONDecodeError:
                    return []
        except Exception as e:
            logger.error(f"Error fetching EGV data: {e}")
            return []


    async def sync_user_data(self, user_email: str) -> Dict[str, Any]:
        logger.info(f"🔄 Starting sync for user: {user_email}")
        
        try:
            account = await self.dexcom_accounts_collection.find_one(
                {"user_email": user_email}
            )
            if not account:
                logger.error(f"❌ Dexcom account not found for user: {user_email}")
                raise Exception("Dexcom account not found")


            access_token = await self.get_valid_access_token(account)
            await self.get_data_range(access_token)
            
            last_sync = account.get("last_sync_time")
            
            if isinstance(last_sync, str):
                last_sync = datetime.fromisoformat(last_sync.replace("Z", "+00:00"))
            elif isinstance(last_sync, datetime) and last_sync.tzinfo is None:
                last_sync = last_sync.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            
            start_time = None
            end_time = None
            
            if last_sync:
                start_time = last_sync + timedelta(seconds=1)
                end_time = now
                
                if (end_time - start_time).days > 30:
                    end_time = start_time + timedelta(days=30)
            else:
                end_time = now
                start_time = end_time - timedelta(days=30)


            readings = await self.fetch_egv_data(access_token, start_time, end_time)


            if not readings:
                await self.dexcom_accounts_collection.update_one(
                    {"user_email": user_email},
                    {"$set": {"last_sync_time": end_time}}
                )
                return {"readings_count": 0, "message": "No data found in range"}


            parsed_readings = []
            for r in readings:
                try:
                    ts_str = r.get("systemTime") or r.get("displayTime")
                    if not ts_str:
                        continue
                    if not ts_str.endswith("Z") and "+" not in ts_str:
                        ts_str += "Z"
                    timestamp = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    parsed_readings.append((timestamp, r))
                except Exception as e:
                    logger.error(f"Error parsing reading: {e}")


            if not parsed_readings:
                return {"readings_count": 0, "message": "No valid readings"}


            timestamps = [ts for ts, _ in parsed_readings]
            min_ts = min(timestamps)
            max_ts = max(timestamps)
            
            existing_docs = await self.cgm_readings_collection.find(
                {
                    "user_email": user_email,
                    "source": "dexcom_api",
                    "timestamp": {"$gte": min_ts, "$lte": max_ts},
                },
                {"timestamp": 1},
            ).to_list(None)
            existing_timestamps = {doc["timestamp"] for doc in existing_docs}


            new_readings = []
            for timestamp, r in parsed_readings:
                if timestamp not in existing_timestamps:
                    new_readings.append({
                        "user_email": user_email,
                        "value": float(r.get("value", 0)),
                        "timestamp": timestamp,
                        "trend": r.get("trend", ""),
                        "trend_rate": r.get("trendRate"),
                        "source": "dexcom_api",
                        "created_at": datetime.now(timezone.utc),
                    })


            new_count = len(new_readings)
            if new_readings:
                await self.cgm_readings_collection.insert_many(new_readings)
                logger.info(f"✅ Saved {new_count} new readings for {user_email}")


            new_last_sync = end_time
            if new_readings:
                new_last_sync = max(r["timestamp"] for r in new_readings)
            
            if last_sync and new_last_sync < last_sync:
                new_last_sync = last_sync
            
            if new_last_sync:
                await self.dexcom_accounts_collection.update_one(
                    {"user_email": user_email},
                    {"$set": {"last_sync_time": new_last_sync}}
                )


            return {
                "readings_count": new_count,
                "message": f"Synced {new_count} new readings",
            }
            
        except Exception as e:
            if "401" in str(e) or "unauthorized" in str(e).lower():  # Dexcom auth failure
                await self.disconnect(user_email)
                logger.warning(f"Disconnected Dexcom for {user_email} due to auth error")
            logger.error(f"❌ Sync failed for user {user_email}: {e}")
            raise


    async def get_latest_reading(self, user_email: str) -> Optional[Dict[str, Any]]:
        latest = await self.cgm_readings_collection.find_one(
            {"user_email": user_email, "source": "dexcom_api"},
            sort=[("timestamp", -1)]
        )
        return latest


    async def get_connection_status(self, user_email: str) -> Dict[str, Any]:
        account = await self.dexcom_accounts_collection.find_one(
            {"user_email": user_email}
        )


        if not account:
            return {
                "connected": False,
                "dexcom_user_id": None,
                "last_sync_time": None,
            }


        return {
            "connected": True,
            "dexcom_user_id": account.get("dexcom_user_id"),
            "last_sync_time": account.get("last_sync_time"),
        }


    async def disconnect(self, user_email: str) -> None:
        await self.dexcom_accounts_collection.delete_one({"user_email": user_email})
        logger.info(f"Dexcom disconnected for user: {user_email}")


_dexcom_service = None
def get_dexcom_service() -> DexcomService:
    global _dexcom_service
    if _dexcom_service is None:
        _dexcom_service = DexcomService()
    return _dexcom_service
