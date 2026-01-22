import requests
from dotenv import load_dotenv
import os

load_dotenv()

mealogic_api_key = os.getenv("MEALOGIC_API_KEY")
if not mealogic_api_key:
    raise ValueError("MEALOGIC_API_KEY environment variable is not set")

headers = {
    "Accept": "application/json",
    "Authorization": "Basic ",
}

base_url = "https://api-stg.mealogic.io/v1/storefronts"


def get_all_storefronts():
    """
    Fetch all storefronts and their associated metros.
    """
    print("Fetching all storefronts and metros...")
    print(f"Request URL: {base_url}\n")

    try:
        response = requests.get(base_url, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            return data
        elif response.status_code == 401:
            print("Unauthorized (401): Invalid credentials supplied.")
            print(f"Response body: {response.text}")
            return None
        else:
            print(f"Unexpected status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return None

    except requests.exceptions.Timeout:
        print("Connection timed out after 30 seconds.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Connection error: {e}")
        return None


def display_storefronts(data):
    """
    Display storefronts and metros in a formatted table.
    """
    if not data or "data" not in data:
        print("No data to display.")
        return

    storefronts = data["data"]
    print(f"\n{'=' * 80}")
    print(f"Found {len(storefronts)} Storefront(s)")
    print(f"{'=' * 80}\n")

    for sf in storefronts:
        sf_id = sf.get("id")
        sf_name = sf.get("name", "Unknown")
        valid_quantities = sf.get("validDeliveryLineItemQuantities", [])
        metros = sf.get("metros", [])

        print(f"STOREFRONT: {sf_name} (ID: {sf_id})")
        print(f"  Valid Line Item Quantities: {valid_quantities}")
        print(f"  Number of Metros: {len(metros)}")
        print("-" * 60)

        if metros:
            print(f"  {'Metro ID':<10} {'Name':<30} {'Delivery Fee':<15} {'ZIP Codes'}")
            print(f"  {'-' * 10} {'-' * 30} {'-' * 15} {'-' * 20}")

            for metro in metros:
                metro_id = metro.get("id")
                metro_name = metro.get("name", "Unknown")
                delivery_fee = metro.get("deliveryFeeInCents", 0)
                postal_codes = metro.get("postalCodes", [])

                # Show fee in dollars
                fee_str = f"${delivery_fee / 100:.2f}"

                # Show first few ZIP codes
                if len(postal_codes) > 3:
                    zips_str = f"{', '.join(postal_codes[:3])}... (+{len(postal_codes) - 3} more)"
                else:
                    zips_str = ", ".join(postal_codes) if postal_codes else "None"

                print(f"  {metro_id:<10} {metro_name:<30} {fee_str:<15} {zips_str}")

        print("\n")


def get_metro_lookup_table(data):
    """
    Create a lookup dictionary for quick metro/storefront reference.
    Returns: {metro_id: {"metro_name": ..., "storefront_id": ..., "storefront_name": ...}}
    """
    lookup = {}

    if not data or "data" not in data:
        return lookup

    for sf in data["data"]:
        sf_id = sf.get("id")
        sf_name = sf.get("name", "Unknown")

        for metro in sf.get("metros", []):
            metro_id = metro.get("id")
            lookup[metro_id] = {
                "metro_id": metro_id,
                "metro_name": metro.get("name", "Unknown"),
                "storefront_id": sf_id,
                "storefront_name": sf_name,
                "delivery_fee_cents": metro.get("deliveryFeeInCents", 0),
                "postal_codes": metro.get("postalCodes", []),
            }

    return lookup


if __name__ == "__main__":
    storefront_data = get_all_storefronts()

    if storefront_data:
        display_storefronts(storefront_data)

        # Also create and display the lookup table
        lookup = get_metro_lookup_table(storefront_data)
        print("\n" + "=" * 80)
        print("METRO LOOKUP TABLE (for quick reference)")
        print("=" * 80)
        for metro_id, info in lookup.items():
            print(
                f"  Metro {metro_id}: {info['metro_name']} -> Storefront: {info['storefront_name']} (ID: {info['storefront_id']})"
            )
