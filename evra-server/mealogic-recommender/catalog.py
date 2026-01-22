import requests
from dotenv import load_dotenv
import os
import traceback

load_dotenv()

mealogic_api_key = os.getenv("MEALOGIC_API_KEY")
if not mealogic_api_key:
    raise ValueError("MEALOGIC_API_KEY environment variable is not set")

headers = {
    "Accept": "application/json",
    "Authorization": "Basic ",
}

base_url = "https://api-stg.mealogic.io/v1/catalogs"

params = {"deliveryWeek": "2025-08-10"}

try:
    # Debug: Print the request details
    print(f"Making request to: {base_url}")
    print(f"Params: {params}")
    print(f"Headers: {headers}")

    response = requests.get(base_url, headers=headers, params=params, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")

    if response.status_code == 200:
        try:
            data = response.json()
            print("Success! Response data:")
            print(data)
        except ValueError:
            print("Invalid JSON response. Raw text:", repr(response.text))
            raise
    elif response.status_code == 401:
        print("Unauthorized (401): Invalid credentials supplied.")
        print(f"Response body: {response.text}")
    else:
        print(
            f"Unexpected status code: {response.status_code}. Body: {response.text[:500]}"
        )
except requests.exceptions.Timeout:
    print("Connection timed out after 30 seconds while contacting Mealogic API.")
except requests.exceptions.RequestException as e:
    print(f"Connection error while contacting Mealogic API: {e}")
    traceback.print_exc()
