import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import requests
from app.config import MEALOGIC_API_KEY
from app.services.backend_services.db import get_db

logger = logging.getLogger(__name__)

MEALOGIC_RESPONSE_LOG = Path(__file__).resolve().parents[3] / "mealogic_api_responses.log"


def _log_mealogic_response_to_file(endpoint: str, data: Any) -> None:
    try:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        with open(MEALOGIC_RESPONSE_LOG, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n[{ts}] MEALOGIC API: {endpoint}\n{'='*80}\n")
            f.write(json.dumps(data, indent=2, default=str))
            f.write("\n")
    except Exception as e:
        logger.warning("[MealoLogic] Failed to write to %s: %s", MEALOGIC_RESPONSE_LOG, e)


class MealogicService:
    """
    Service to fetch meal recommendations from MealoLogic API.
    
    Flow:
    1. Get user's zip code (default to 94085 if not found)
    2. Get metro and storefront info from zip code
    3. Get catalog for the storefront
    4. Get variant (meal) details with nutrition info
    """
    
    DEFAULT_ZIP_CODE = "94085"
    BASE_URL = "https://api-stg.mealogic.io/v1"
    
    def __init__(self):
        raw = (MEALOGIC_API_KEY or "").strip().strip('"\'')
        if not raw:
            self.api_key = None
            logger.info("[MealoLogic] MEALOGIC_API_KEY not set - integration disabled")
        else:
            self.api_key = raw
            
        self.db = get_db()
        self.user_collection = self.db["users"]
        
        self._storefront_cache = None
        self._cache_timestamp = None
        self._cache_duration = timedelta(hours=24)
    
    def _get_headers(self) -> Dict[str, str]:
        """Headers with Authorization: Basic <api_key>. MealoLogic expects the raw key directly in the header."""
        return {
            "Accept": "application/json",
            "Authorization": f"Basic {self.api_key}",
        }

    async def _get_user_zip_code(self, user_email: str) -> str:
        """
        Get user's zip code from database.
        Returns DEFAULT_ZIP_CODE (94085) if not found.
        
        This is ready for when zip_code is added to user table - 
        no changes needed when frontend starts sending zip codes.
        """
        try:
            user = await self.user_collection.find_one(
                {"email": user_email},
                {"zip_code": 1}
            )
            if user and user.get("zip_code"):
                return str(user["zip_code"])
            return self.DEFAULT_ZIP_CODE
        except Exception as e:
            logger.error(f"[MealoLogic] Error fetching user zip code: {e}", exc_info=True)
            return self.DEFAULT_ZIP_CODE
    
    def _get_storefronts(self) -> Optional[Dict[str, Any]]:
        """
        Fetch all storefronts and metros from MealoLogic API.
        Results are cached for 24 hours.
        """
        if not self.api_key:
            return None

        if self._storefront_cache and self._cache_timestamp:
            if datetime.now() - self._cache_timestamp < self._cache_duration:
                n = len(self._storefront_cache.get("data", []))
                logger.warning("[MealoLogic] Storefronts: from cache, n=%s", n)
                return self._storefront_cache

        try:
            logger.warning("[MealoLogic] Storefronts: GET %s/storefronts", self.BASE_URL)
            response = requests.get(
                f"{self.BASE_URL}/storefronts",
                headers=self._get_headers(),
                timeout=30,
            )
            body = response.text
            body_preview = body[:500] if body else "(empty)"

            if response.status_code == 200:
                data = response.json()
                n = len(data.get("data", []))
                self._storefront_cache = data
                self._cache_timestamp = datetime.now()
                logger.warning("[MealoLogic] Storefronts: OK status=200 n_storefronts=%s", n)
                return data
            if response.status_code == 401:
                logger.error("[MealoLogic] Storefronts 401 Unauthorized. Check MEALOGIC_API_KEY (Authorization: Basic <key>). body=%s", body_preview)
                return None
            logger.error("[MealoLogic] Storefronts failed: status=%s body=%s", response.status_code, body_preview)
            return None
        except Exception as e:
            logger.error("[MealoLogic] Storefronts request error: %s", e, exc_info=True)
            return None
    
    def _find_metro_by_zip(self, zip_code: str, storefront_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Find metro and storefront information for a given zip code.
        
        Returns:
            {
                "metro_id": int,
                "metro_name": str,
                "storefront_id": int,
                "storefront_name": str,
                "postal_codes": List[str]
            }
        """
        if not storefront_data or "data" not in storefront_data:
            return None

        for storefront in storefront_data["data"]:
            storefront_id = storefront.get("id")
            storefront_name = storefront.get("name", "Unknown")
            for metro in storefront.get("metros", []):
                if zip_code in (metro.get("postalCodes") or []):
                    out = {
                        "metro_id": metro.get("id"),
                        "metro_name": metro.get("name", "Unknown"),
                        "storefront_id": storefront_id,
                        "storefront_name": storefront_name,
                        "postal_codes": metro.get("postalCodes", [])
                    }
                    logger.warning("[MealoLogic] Metro: found zip=%s -> metro_id=%s storefront_id=%s", zip_code, out["metro_id"], storefront_id)
                    return out
        logger.warning("[MealoLogic] Metro: no match for zip=%s", zip_code)
        return None
    
    def _get_catalog(self, storefront_id: int, metro_id: int) -> Optional[Dict[str, Any]]:
        """
        Get catalog for a metro and delivery week.
        API accepts only deliveryWeek; it returns all catalogs for that week.
        We filter by metroId client-side.
        """
        if not self.api_key:
            return None

        try:
            today = datetime.now()
            days_until_sunday = (6 - today.weekday()) % 7
            if days_until_sunday == 0:
                days_until_sunday = 7
            next_sunday = today + timedelta(days=days_until_sunday)
            delivery_week = next_sunday.strftime("%Y-%m-%d")

            logger.warning("[MealoLogic] Catalog: GET deliveryWeek=%s metro_id=%s", delivery_week, metro_id)
            response = requests.get(
                f"{self.BASE_URL}/catalogs",
                headers=self._get_headers(),
                params={"deliveryWeek": delivery_week},
                timeout=30,
            )
            body = response.text

            if response.status_code == 200:
                data = response.json()
                catalogs = data.get("data", [])
                matching = [
                    c for c in catalogs 
                    if c.get("metroId") is not None and str(c.get("metroId")) == str(metro_id)
                ]
                n_items = sum(len(c.get("items") or []) for c in matching)
                logger.warning("[MealoLogic] Catalog: OK n_catalogs=%s n_matching=%s n_items=%s", len(catalogs), len(matching), n_items)
                return {"data": matching}
            if response.status_code == 401:
                logger.error("[MealoLogic] Catalog 401 Unauthorized. body=%s", repr((body or "")[:300]))
                return None
            logger.error("[MealoLogic] Catalog failed: status=%s body=%s", response.status_code, repr((body or "")[:300]))
            return None
        except Exception as e:
            logger.error("[MealoLogic] Catalog request error: %s", e, exc_info=True)
            return None
    
    def _get_variants(self, variant_ids: List[int], limit: int = 20) -> Optional[Dict[str, Any]]:
        """
        Get detailed variant (meal) information including nutrition data.
        
        Args:
            variant_ids: List of variant IDs to fetch
            limit: Maximum number of variants to fetch (default 20)
        """
        if not self.api_key or not variant_ids:
            return None

        try:
            ids_to_fetch = variant_ids[:limit]
            # API spec: ids is array. Pass list -> ?ids=1&ids=2&ids=3 (comma-str can return only 1)
            logger.warning("[MealoLogic] Variants: GET ids=%s (first5=%s)", len(ids_to_fetch), ids_to_fetch[:5])
            response = requests.get(
                f"{self.BASE_URL}/variants",
                headers=self._get_headers(),
                params={"ids": ids_to_fetch},
                timeout=30,
            )
            body = response.text

            if response.status_code == 200:
                data = response.json()
                got = len(data.get("data", []))
                _log_mealogic_response_to_file("GET /variants", data)
                logger.warning("[MealoLogic] Variants: OK requested=%s got=%s (see %s)", len(ids_to_fetch), got, MEALOGIC_RESPONSE_LOG)
                return data
            if response.status_code == 401:
                logger.error("[MealoLogic] Variants 401 Unauthorized. body=%s", repr((body or "")[:300]))
                return None
            logger.error("[MealoLogic] Variants failed: status=%s body=%s", response.status_code, repr((body or "")[:300]))
            return None
        except Exception as e:
            logger.error("[MealoLogic] Variants request error: %s", e, exc_info=True)
            return None
    
    def _format_meal_data_for_context(
        self, variants_data: Dict[str, Any], catalog_items: List[Dict[str, Any]]
    ) -> str:
        """
        Minified JSON for LLM: id, name, sub, desc, price, macros, macroNutrients (full),
        publicIngredients (full), tags. Drops: imageUrl, designer, ingredientsToAvoid, internal IDs.
        """
        data = (variants_data or {}).get("data")
        if not data:
            return ""

        price_lookup = {
            item.get("variantId"): item.get("priceInCents", 0)
            for item in catalog_items
            if item.get("variantId") is not None
        }

        optimized = []
        for v in data:
            product = v.get("product", {}) or {}
            macros = v.get("macroNutrients") or {}
            price_cents = price_lookup.get(v.get("id"), 0)
            price_str = f"${price_cents / 100:.2f}"
            tags = [t.get("displayName") for t in v.get("tags", []) if t.get("displayName")]

            meal = {
                "id": v.get("id"),
                "name": product.get("title", "Unknown"),
                "sub": product.get("subtitle") or None,
                "desc": product.get("description") or None,
                "price": price_str,
                "macros": {
                    "cal": macros.get("calories"),
                    "pro": f"{macros.get('proteinInGrams') or 0}g",
                    "fat": f"{macros.get('totalFatInGrams') or 0}g",
                    "carbs": f"{macros.get('totalCarbsInGrams') or 0}g",
                },
                "macroNutrients": macros,
                "publicIngredients": v.get("publicIngredients") or None,
                "tags": tags,
            }
            optimized.append(meal)

        out = json.dumps(optimized, separators=(',', ':'), default=str)
        logger.warning("[MealoLogic] Format: n_meals=%s out_len=%s", len(optimized), len(out))
        return out
    
    async def get_meal_recommendations(self, user_email: str) -> Optional[str]:
        """
        Main method to get meal recommendations for a user.
        
        Returns formatted string with meal data ready to be added to LLM context,
        or None if MealoLogic is disabled or data fetch fails.
        
        This method:
        1. Gets user's zip code (or uses default 94085)
        2. Finds matching metro/storefront
        3. Gets available catalog
        4. Fetches variant details with nutrition
        5. Formats everything for LLM consumption
        """
        if not self.api_key:
            return None

        try:
            zip_code = await self._get_user_zip_code(user_email)
            storefront_data = await asyncio.to_thread(self._get_storefronts)
            if not storefront_data:
                return None

            metro_info = self._find_metro_by_zip(zip_code, storefront_data)
            if not metro_info:
                return None

            catalog_data = await asyncio.to_thread(
                self._get_catalog,
                metro_info["storefront_id"],
                metro_info["metro_id"],
            )
            if not catalog_data or "data" not in catalog_data:
                return None

            catalog_items = []
            for catalog in catalog_data["data"]:
                items = catalog.get("items") or []
                catalog_items.extend(items)

            variant_ids = [
                item.get("variantId")
                for item in catalog_items
                if item.get("variantId") is not None
            ]
            logger.warning("[MealoLogic] get_meal_recommendations: catalog_items=%s variant_ids=%s (first5=%s)", len(catalog_items), len(variant_ids), variant_ids[:5] if variant_ids else [])

            if not variant_ids:
                return None

            variants_data = await asyncio.to_thread(self._get_variants, variant_ids, 20)
            if not variants_data:
                return None

            out = self._format_meal_data_for_context(variants_data, catalog_items) or None
            if out:
                logger.warning("[MealoLogic] get_meal_recommendations: OK len=%s", len(out))
            return out

        except Exception as e:
            logger.error("[MealoLogic] get_meal_recommendations FAILED: %s", e, exc_info=True)
            return None


_mealogic_service = None


def get_mealogic_service() -> MealogicService:
    """Get singleton instance of MealogicService."""
    global _mealogic_service
    if _mealogic_service is None:
        _mealogic_service = MealogicService()
    return _mealogic_service
