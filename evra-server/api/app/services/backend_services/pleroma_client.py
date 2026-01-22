import aiohttp
import json
import logging
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime
from aiohttp import FormData

from app.config import (
    PLEROMA_INSTANCE_URL,
    PLEROMA_ADMIN_TOKEN,
    PLEROMA_CLIENT_NAME,
    PLEROMA_REDIRECT_URI,
    PLEROMA_SCOPES
)

logger = logging.getLogger(__name__)


class PleromaClient:
    """Client for interacting with Pleroma/Mastodon API"""
    
    def __init__(self):
        self.instance_url = PLEROMA_INSTANCE_URL.rstrip('/')
        self.admin_token = PLEROMA_ADMIN_TOKEN
        self.client_name = PLEROMA_CLIENT_NAME
        self.redirect_uri = PLEROMA_REDIRECT_URI
        self.scopes = PLEROMA_SCOPES
        
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        access_token: Optional[str] = None,
        data: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        admin: bool = False
    ) -> Dict[str, Any]:
        """Make HTTP request to Pleroma API"""
        url = f"{self.instance_url}{endpoint}"
        headers = {}
        
        logger.info(f"Making {method} request to {url}")
        logger.debug(f"Headers: admin={admin}, access_token={'yes' if access_token else 'no'}")
        logger.debug(f"Payload: {json_data or data}")
        
        if admin and self.admin_token:
            headers["Authorization"] = f"Bearer {self.admin_token}"
            logger.debug(f"Using admin token for request to {endpoint}")
        elif access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
            
        timeout = aiohttp.ClientTimeout(total=30)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.request(
                    method,
                    url,
                    headers=headers,
                    data=data,
                    json=json_data
                ) as response:
                    response_text = await response.text()
                    logger.info(f"Response status: {response.status}")
                    logger.debug(f"Response body: {response_text[:200]}")
                    
                    if response.status >= 400:
                        logger.error(f"Pleroma API error: {response.status} - {response_text}")
                        error_msg = f"Pleroma API error: {response.status}"
                        if response_text:
                            try:
                                error_json = json.loads(response_text)
                                if "error" in error_json:
                                    error_msg += f" - {error_json.get('error', response_text)}"
                                else:
                                    error_msg += f" - {response_text[:200]}"
                            except:
                                error_msg += f" - {response_text[:200]}"
                        raise Exception(error_msg)
                    
                    if response_text:
                        return json.loads(response_text)
                    return {}
        except Exception as e:
            logger.error(f"Error making request to Pleroma: {e}", exc_info=True)
            raise
    
    async def create_app(self) -> Dict[str, Any]:
        """Register application with Pleroma to get client credentials"""
        data = {
            "client_name": self.client_name,
            "redirect_uris": self.redirect_uri,
            "scopes": self.scopes
        }
        
        return await self._make_request(
            "POST",
            "/api/v1/apps",
            data=data
        )
    
    async def create_user_via_admin(self, email: str, username: str, password: str) -> Dict[str, Any]:
        """
        Create a user using Pleroma Admin API.
        Requires admin token with 'admin:write:accounts' scope.
        """
        if not self.admin_token:
            raise Exception("Admin token not configured. Cannot create user via Admin API.")
        
        logger.info(f"Creating user via Pleroma Admin API: username={username}, email={email}")
        
        json_data = {
            "users": [{
                "nickname": username,
                "email": email,
                "password": password
            }]
        }

        try:
            result = await self._make_request(
                "POST",
                "/api/pleroma/admin/users",
                admin=True,
                json_data=json_data
            )
            logger.info(f"Successfully created user {username} via Admin API")
            return result
        except Exception as e:
            error_str = str(e)
            logger.error(f"Failed to create user via Admin API: {error_str}")
            raise


    async def get_user_token(self, username: str, password: str, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Get user access token using password grant"""
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "password",
            "username": username,
            "password": password,
            "scope": self.scopes
        }
        
        url = f"{self.instance_url}/oauth/token"
        
        logger.info(f"Requesting OAuth token for username: {username}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    response_text = await response.text()
                    
                    logger.info(f"OAuth response status: {response.status}")
                    logger.debug(f"OAuth response body: {response_text}")
                    
                    if response.status >= 400:
                        logger.error(f"OAuth token error: {response.status} - Response: {response_text}")
                        logger.error(f"Attempted with username={username}, client_id={client_id[:10]}...")
                        raise Exception(f"OAuth token error: {response.status} - {response_text}")
                    
                    return await response.json()
        except Exception as e:
            logger.error(f"Error getting OAuth token for {username}: {e}", exc_info=True)
            raise
    
    async def verify_credentials(self, access_token: str) -> Dict[str, Any]:
        """Verify user credentials and get account info"""
        return await self._make_request(
            "GET",
            "/api/v1/accounts/verify_credentials",
            access_token=access_token
        )
    
    async def create_status(
        self,
        access_token: str,
        content: str,
        visibility: str = "public",
        in_reply_to_id: Optional[str] = None,
        media_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new status (post)"""
        json_data = {
            "status": content,
            "visibility": visibility
        }
        
        if in_reply_to_id:
            json_data["in_reply_to_id"] = in_reply_to_id
        
        if media_ids:
            json_data["media_ids"] = media_ids
        
        return await self._make_request(
            "POST",
            "/api/v1/statuses",
            access_token=access_token,
            json_data=json_data
        )
    
    async def get_status(self, status_id: str, access_token: Optional[str] = None) -> Dict[str, Any]:
        """Get a single status by ID"""
        return await self._make_request(
            "GET",
            f"/api/v1/statuses/{status_id}",
            access_token=access_token
        )
    
    async def update_status(
        self,
        access_token: str,
        status_id: str,
        content: str
    ) -> Dict[str, Any]:
        """Update a status (edit)"""
        json_data = {
            "status": content
        }
        
        return await self._make_request(
            "PUT",
            f"/api/v1/statuses/{status_id}",
            access_token=access_token,
            json_data=json_data
        )
    
    async def delete_status(self, access_token: str, status_id: str) -> Dict[str, Any]:
        """Delete a status"""
        return await self._make_request(
            "DELETE",
            f"/api/v1/statuses/{status_id}",
            access_token=access_token
        )
    
    async def get_public_timeline(
        self,
        local: bool = True,
        limit: int = 20,
        max_id: Optional[str] = None,
        access_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get public timeline"""
        params = f"?local={'true' if local else 'false'}&limit={limit}"
        if max_id:
            params += f"&max_id={max_id}"
        
        return await self._make_request(
            "GET",
            f"/api/v1/timelines/public{params}",
            access_token=access_token
        )
    
    async def get_account_statuses(
        self,
        account_id: str,
        limit: int = 20,
        max_id: Optional[str] = None,
        access_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get statuses from a specific account"""
        params = f"?limit={limit}"
        if max_id:
            params += f"&max_id={max_id}"
        
        return await self._make_request(
            "GET",
            f"/api/v1/accounts/{account_id}/statuses{params}",
            access_token=access_token
        )
    
    async def get_all_account_statuses(
        self,
        account_id: str,
        access_token: str,
        limit: int = 40
    ) -> List[Dict[str, Any]]:
        """
        Get ALL statuses (posts and comments) from a specific account.
        Uses pagination to fetch all statuses.
        """
        all_statuses = []
        max_id = None
        
        while True:
            params = f"?limit={limit}"
            if max_id:
                params += f"&max_id={max_id}"
            
            try:
                statuses = await self._make_request(
                    "GET",
                    f"/api/v1/accounts/{account_id}/statuses{params}",
                    access_token=access_token
                )
                
                if not statuses or len(statuses) == 0:
                    break
                
                all_statuses.extend(statuses)
                
                if len(statuses) < limit:
                    break
                
                max_id = statuses[-1]["id"]
                
            except Exception as e:
                logger.error(f"Error fetching statuses for account {account_id}: {e}")
                break
        
        return all_statuses
    
    async def favourite_status(self, access_token: str, status_id: str) -> Dict[str, Any]:
        """Favourite (like) a status"""
        return await self._make_request(
            "POST",
            f"/api/v1/statuses/{status_id}/favourite",
            access_token=access_token,
            json_data={}
        )
    
    async def unfavourite_status(self, access_token: str, status_id: str) -> Dict[str, Any]:
        """Unfavourite (unlike) a status"""
        return await self._make_request(
            "POST",
            f"/api/v1/statuses/{status_id}/unfavourite",
            access_token=access_token,
            json_data={}
        )
    
    async def reblog_status(self, access_token: str, status_id: str) -> Dict[str, Any]:
        """Reblog (share) a status"""
        return await self._make_request(
            "POST",
            f"/api/v1/statuses/{status_id}/reblog",
            access_token=access_token,
            json_data={}
        )
    
    async def upload_media(
        self,
        access_token: str,
        file_content: bytes,
        file_name: str,
        mime_type: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload media file to Pleroma.
        Returns media attachment with id that can be used in create_status.
        """
        url = f"{self.instance_url}/api/v1/media"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        form_data = FormData()
        form_data.add_field('file', file_content, filename=file_name, content_type=mime_type or 'application/octet-stream')
        if description:
            form_data.add_field('description', description)
        
        timeout = aiohttp.ClientTimeout(total=60)  # Longer timeout for file uploads
        
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, headers=headers, data=form_data) as response:
                    response_text = await response.text()
                    
                    if response.status >= 400:
                        error_msg = f"Pleroma API error: {response.status}"
                        if response_text:
                            try:
                                error_json = json.loads(response_text)
                                if "error" in error_json:
                                    error_msg += f" - {error_json.get('error', response_text)}"
                                else:
                                    error_msg += f" - {response_text[:200]}"
                            except:
                                error_msg += f" - {response_text[:200]}"
                        raise Exception(error_msg)
                    
                    if response_text:
                        result = json.loads(response_text)
                        logger.info(f"Uploaded media {result.get('id')} for file {file_name}")
                        return result
                    return {}
        except Exception as e:
            logger.error(f"Error uploading media: {e}", exc_info=True)
            raise
    
    async def get_status_context(
        self,
        status_id: str,
        access_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get context (ancestors and descendants) of a status - used for comments"""
        return await self._make_request(
            "GET",
            f"/api/v1/statuses/{status_id}/context",
            access_token=access_token
        )
    
    async def search_accounts(
        self,
        query: str,
        access_token: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for accounts"""
        return await self._make_request(
            "GET",
            f"/api/v1/accounts/search?q={query}&limit={limit}",
            access_token=access_token
        )
    
    async def update_account(
        self,
        access_token: str,
        display_name: Optional[str] = None,
        note: Optional[str] = None,
        avatar: Optional[str] = None,
        header: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update account information (display name, bio, etc.)"""
        json_data = {}
        
        if display_name is not None:
            json_data["display_name"] = display_name
        if note is not None:
            json_data["note"] = note
        if avatar is not None:
            json_data["avatar"] = avatar
        if header is not None:
            json_data["header"] = header
        
        if not json_data:
            raise ValueError("At least one field must be provided to update")
        
        return await self._make_request(
            "PATCH",
            "/api/v1/accounts/update_credentials",
            access_token=access_token,
            json_data=json_data
        )


_pleroma_client_instance = None


def get_pleroma_client() -> PleromaClient:
    """Get or create PleromaClient instance (singleton)"""
    global _pleroma_client_instance
    
    if _pleroma_client_instance is None:
        _pleroma_client_instance = PleromaClient()
    
    return _pleroma_client_instance

