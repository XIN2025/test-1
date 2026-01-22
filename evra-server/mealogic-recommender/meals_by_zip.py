import requests
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

load_dotenv()

headers = {
    "Accept": "application/json",
    "Authorization": "Basic ",
}

BASE_URL = "https://api-stg.mealogic.io/v1"


def get_next_sunday() -> str:
    """Calculate the next Sunday's date for deliveryWeek."""
    today = datetime.now()
    days_until_sunday = (6 - today.weekday()) % 7
    if days_until_sunday == 0:
        days_until_sunday = 7
    next_sunday = today + timedelta(days=days_until_sunday)
    return next_sunday.strftime("%Y-%m-%d")


def find_metro_by_zip(zip_code: str) -> dict | None:
    """
    Find the metro and storefront for a given ZIP code.
    Returns: {"metro_id": int, "metro_name": str, "storefront_id": int, "storefront_name": str}
    """
    response = requests.get(f"{BASE_URL}/storefronts", headers=headers, timeout=30)
    if response.status_code != 200:
        print(f"Failed to fetch storefronts: {response.status_code}")
        return None

    data = response.json()
    for storefront in data.get("data", []):
        for metro in storefront.get("metros", []):
            if zip_code in metro.get("postalCodes", []):
                return {
                    "metro_id": metro.get("id"),
                    "metro_name": metro.get("name"),
                    "storefront_id": storefront.get("id"),
                    "storefront_name": storefront.get("name"),
                    "delivery_fee_cents": metro.get("deliveryFeeInCents", 0),
                }

    return None


def get_catalog_for_metro(delivery_week: str, metro_id: int) -> dict | None:
    """Get catalog items for a specific metro and delivery week."""
    params = {"deliveryWeek": delivery_week}
    response = requests.get(
        f"{BASE_URL}/catalogs", headers=headers, params=params, timeout=30
    )

    if response.status_code != 200:
        print(f"Failed to fetch catalogs: {response.status_code}")
        return None

    data = response.json()
    # Find catalog matching the metro
    for catalog in data.get("data", []):
        if catalog.get("metroId") == metro_id:
            return catalog

    return None


def get_variants_by_ids(variant_ids: list[int]) -> list[dict]:
    """Fetch detailed variant information for a list of variant IDs."""
    if not variant_ids:
        return []

    # API expects ids as query param array
    params = {"ids": variant_ids}
    response = requests.get(
        f"{BASE_URL}/variants", headers=headers, params=params, timeout=30
    )

    if response.status_code != 200:
        print(f"Failed to fetch variants: {response.status_code}")
        return []

    data = response.json()
    return data.get("data", [])


def get_meals_for_zip(zip_code: str, delivery_week: str = None) -> dict:
    """
    Main function: Get all available meals for a ZIP code.
    Returns full variant details with pricing.
    """
    if delivery_week is None:
        delivery_week = get_next_sunday()

    print(f"Finding meals for ZIP: {zip_code}, Delivery Week: {delivery_week}")
    print("-" * 60)

    # Step 1: Find metro for ZIP
    metro_info = find_metro_by_zip(zip_code)
    if not metro_info:
        print(f"ZIP code {zip_code} is not supported.")
        return {"error": "ZIP code not supported", "zip_code": zip_code}

    print(f"Found: {metro_info['metro_name']} (Metro ID: {metro_info['metro_id']})")
    print(
        f"Storefront: {metro_info['storefront_name']} (ID: {metro_info['storefront_id']})"
    )
    print(f"Delivery Fee: ${metro_info['delivery_fee_cents'] / 100:.2f}")
    print("-" * 60)

    # Step 2: Get catalog for this metro
    catalog = get_catalog_for_metro(delivery_week, metro_info["metro_id"])
    if not catalog:
        print(f"No catalog found for metro {metro_info['metro_id']} on {delivery_week}")
        return {"error": "No catalog available", "metro_info": metro_info}

    print("Catalog found!")
    print(f"  Delivery Dates: {catalog.get('deliveryDates')}")
    print(f"  Sellable: {catalog.get('sellableFrom')} to {catalog.get('sellableTo')}")
    print(f"  Available Items: {len(catalog.get('items', []))}")
    print("-" * 60)

    # Step 3: Get variant details
    catalog_items = catalog.get("items", [])
    variant_ids = [item["variantId"] for item in catalog_items]

    # Create price lookup from catalog
    price_lookup = {item["variantId"]: item["priceInCents"] for item in catalog_items}

    variants = get_variants_by_ids(variant_ids)
    print(f"Fetched details for {len(variants)} variants")

    # Combine variant details with pricing
    meals = []
    for variant in variants:
        variant_id = variant.get("id")
        product = variant.get("product", {})
        macros = variant.get("macroNutrients", {})

        meals.append(
            {
                "variant_id": variant_id,
                "price_cents": price_lookup.get(variant_id, 0),
                "title": product.get("title"),
                "subtitle": product.get("subtitle"),
                "description": product.get("description"),
                "image_url": product.get("imageUrl"),
                "category": product.get("category"),
                "servings": product.get("numberOfServings"),
                "designer": product.get("designer", {}).get("name"),
                "calories": macros.get("calories"),
                "protein_g": macros.get("proteinInGrams"),
                "carbs_g": macros.get("totalCarbsInGrams"),
                "fat_g": macros.get("totalFatInGrams"),
                "ingredients": variant.get("publicIngredients"),
                "tags": [t.get("displayName") for t in variant.get("tags", [])],
            }
        )

    return {
        "zip_code": zip_code,
        "delivery_week": delivery_week,
        "metro_info": metro_info,
        "catalog_info": {
            "delivery_dates": catalog.get("deliveryDates"),
            "sellable_from": catalog.get("sellableFrom"),
            "sellable_to": catalog.get("sellableTo"),
        },
        "meals": meals,
    }


if __name__ == "__main__":
    # Example: Get meals for a specific ZIP code
    ZIP_CODE = "94085"  # Change this to test different ZIPs

    result = get_meals_for_zip(ZIP_CODE)

    if "meals" in result:
        print(f"\n{'=' * 60}")
        print(f"AVAILABLE MEALS FOR ZIP {ZIP_CODE}")
        print(f"{'=' * 60}\n")

        for meal in result["meals"][:10]:  # Show first 10
            print(f"[{meal['variant_id']}] {meal['title']}")
            print(f"    {meal['subtitle'] or ''}")
            print(
                f"    Price: ${meal['price_cents'] / 100:.2f} | {meal['calories']} cal | {meal['protein_g']}g protein"
            )
            print(f"    Category: {meal['category']} | Servings: {meal['servings']}")
            print(f"    Tags: {', '.join(meal['tags']) if meal['tags'] else 'None'}")
            print()

        if len(result["meals"]) > 10:
            print(f"... and {len(result['meals']) - 10} more meals available!")
