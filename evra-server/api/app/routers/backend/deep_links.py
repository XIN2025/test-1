"""
Deep Link Routes for Evra App
Handles Universal Links (iOS) and App Links (Android) with HTML fallback pages
"""

import logging
import os
import secrets
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, Response

logger = logging.getLogger(__name__)

# Create router
deep_links_router = APIRouter()

# ============================================================================
# CONFIGURATION - Environment variables
# ============================================================================
ANDROID_PACKAGE = os.getenv("ANDROID_PACKAGE", "com.evra.app")
IOS_BUNDLE_ID = os.getenv("IOS_BUNDLE_ID", "com.evra.app")
APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID", "")
ANDROID_SHA256_FINGERPRINT = os.getenv("ANDROID_SHA256_FINGERPRINT", "")
ANDROID_SHA256_FINGERPRINT_EAS = os.getenv("ANDROID_SHA256_FINGERPRINT_EAS", "")
PLAY_STORE_ID = os.getenv("ANDROID_PLAY_STORE_ID", "com.evra.app")
APP_STORE_ID = os.getenv("IOS_APP_STORE_ID", "")


def detect_platform(user_agent: str) -> str:
    """
    Detects the user's platform based on the User-Agent string.
    Returns: 'android', 'ios', 'windows', or 'desktop'
    """
    ua = user_agent.lower()
    logger.debug(f"Detecting platform from User-Agent: {ua[:100]}...")  # Log first 100 chars
    
    if "android" in ua:
        platform = "android"
    elif any(device in ua for device in ["iphone", "ipad", "ipod"]):
        platform = "ios"
    elif "windows phone" in ua:
        platform = "windows"
    else:
        platform = "desktop"
    
    logger.info(f"Platform detected: {platform}")
    return platform


def generate_fallback_html(deep_link: str, platform: str, nonce: str, deep_link_path: str) -> str:
    """
    Generates the HTML fallback page that attempts to open the app.
    If app is not installed, redirects to the appropriate store.
    """
    logger.debug(f"Generating fallback HTML - deep_link: {deep_link}, platform: {platform}, path: {deep_link_path}")
    
    play_store_url = f"https://play.google.com/store/apps/details?id={PLAY_STORE_ID}"
    app_store_url = f"https://apps.apple.com/app/evra/id{APP_STORE_ID}" if APP_STORE_ID else ""
    
    logger.debug(f"Store URLs - Play Store: {play_store_url}, App Store: {app_store_url if app_store_url else 'Not configured'}")
    
    # Determine store URL based on platform
    if platform == "android":
        store_url = play_store_url
    elif platform == "ios" and app_store_url:
        store_url = app_store_url
    else:
        store_url = ""
    
    # Generate store buttons HTML
    if platform == "android":
        store_buttons = f'<a href="{play_store_url}" class="btn btn-secondary">Get from Play Store</a>'
    elif platform == "ios" and app_store_url:
        store_buttons = f'<a href="{app_store_url}" class="btn btn-secondary">Get from App Store</a>'
    else:
        store_buttons = f'''
            <a href="{play_store_url}" class="btn btn-secondary">Android App</a>
            {f'<a href="{app_store_url}" class="btn btn-secondary">iOS App</a>' if app_store_url else ''}
        '''
    
    logger.debug(f"Generated HTML with store buttons for platform: {platform}")
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evra - Opening App</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #FFF8E9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .container {{ 
            background: #FFFFFF;
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 12px rgba(18, 63, 46, 0.1);
            border: 1px solid #D5C9B7;
        }}
        .logo-container {{
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 20px;
        }}
        h1 {{ 
            color: #333333; 
            margin-bottom: 10px; 
            font-size: 24px; 
            font-weight: 600;
        }}
        .subtitle {{ 
            color: #777777; 
            margin-bottom: 30px; 
            font-size: 16px;
        }}
        .platform-info {{ 
            background: #FCEFD1;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #49463C;
            text-align: left;
            word-break: break-all;
            border: 1px solid #D5C9B7;
        }}
        .platform-badge {{ 
            display: inline-block;
            background: #123F2E;
            color: #FFF8E9;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 5px;
        }}
        .platform-info strong {{
            color: #333333;
        }}
        .platform-info code {{
            background: #FFF8E9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #123F2E;
            border: 1px solid #D5C9B7;
        }}
        .btn {{ 
            display: inline-block;
            padding: 15px 30px;
            margin: 10px;
            border: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 200px;
        }}
        .btn-primary {{ 
            background: #123F2E;
            color: #FFF8E9;
        }}
        .btn-primary:hover {{ 
            background: #0F3325;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(18, 63, 46, 0.2);
        }}
        .btn-secondary {{ 
            background: #FCEFD1;
            color: #123F2E;
            border: 2px solid #D5C9B7;
        }}
        .btn-secondary:hover {{ 
            background: #F4BF4D;
            border-color: #123F2E;
            transform: translateY(-1px);
        }}
        @media (max-width: 480px) {{ 
            .container {{ padding: 30px 20px; }}
            .btn {{ min-width: auto; width: 100%; margin: 5px 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="/static/logo.png" alt="Evra Logo" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="logo" style="display: none; background: #123F2E; border-radius: 20px; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #FFF8E9;">E</div>
        </div>
        <h1>Evra</h1>
        <p class="subtitle" id="status-text">Attempting to open your content in the app...</p>
        <div class="platform-info">
            <div class="platform-badge">{platform}</div>
            <div><strong>Detected:</strong> {platform.capitalize()}</div>
            <div style="margin-top: 8px;"><strong>Link:</strong> <code>{deep_link}</code></div>
        </div>
        <div class="actions">
            <a href="{deep_link}" class="btn btn-primary" id="openApp">Open in App</a>
            {store_buttons}
        </div>
    </div>
    <script nonce="{nonce}">
        (function() {{
            const platform = '{platform}';
            const deepLink = '{deep_link}';
            const storeUrl = '{store_url}';
            const statusText = document.getElementById('status-text');
            
            // Desktop users don't need automatic redirect
            if (platform !== 'android' && platform !== 'ios') {{
                console.log('Desktop platform detected - manual action required.');
                statusText.textContent = 'Please install our mobile app to view this content!';
                return;
            }}
            
            let timeout;
            
            // Listen for visibility change (user switched to app)
            const visibilityChangeHandler = () => {{
                if (document.visibilityState === 'hidden') {{
                    // User likely switched to the app - clear timeout
                    clearTimeout(timeout);
                    document.removeEventListener('visibilitychange', visibilityChangeHandler);
                }}
            }};
            
            document.addEventListener('visibilitychange', visibilityChangeHandler);
            
            // Set timeout to redirect to store if app doesn't open
            timeout = setTimeout(() => {{
                console.log('Deep link timeout. App is likely not installed. Redirecting to store.');
                statusText.textContent = 'App not found. Redirecting to the store...';
                if (storeUrl) {{
                    window.location.href = storeUrl;
                }}
                document.removeEventListener('visibilitychange', visibilityChangeHandler);
            }}, 2500);
            
            // Attempt to open the app via deep link
            window.location.href = deepLink;
        }})();
    </script>
</body>
</html>"""


# ============================================================================
# WELL-KNOWN ROUTES - Required for Universal Links (iOS) and App Links (Android)
# ============================================================================

@deep_links_router.get("/.well-known/apple-app-site-association")
async def apple_app_site_association():
    """
    iOS Universal Links verification file.
    This tells iOS which URLs should open your app.
    Note: Universal Links require HTTPS and a real domain (won't work with localhost).
    For production, this must be accessible at: https://api.evra.opengig.work/.well-known/apple-app-site-association
    """
    logger.info("Apple App Site Association requested")
    try:
        if not APPLE_TEAM_ID or not IOS_BUNDLE_ID:
            logger.warning(f"APPLE_TEAM_ID or IOS_BUNDLE_ID not configured - APPLE_TEAM_ID: {bool(APPLE_TEAM_ID)}, IOS_BUNDLE_ID: {bool(IOS_BUNDLE_ID)}")
            return JSONResponse(
                content={"error": "Configuration missing"},
                status_code=500
            )
        
        app_id = f"{APPLE_TEAM_ID}.{IOS_BUNDLE_ID}"
        logger.info(f"Serving Apple App Site Association for app ID: {app_id}")
        
        response_data = {
            "applinks": {
                "details": [
                    {
                        "appIDs": [app_id],
                        "components": [
                            {
                                "/": "/api/delete-account/*",
                                "exclude": True,
                                "comment": "Exclude delete-account - browser only"
                            },
                            {
                                "/": "/*",
                                "comment": "All other paths open in app"
                            }
                        ],
                    }
                ]
            },
            "webcredentials": {
                "apps": [app_id]
            },
        }
        
        logger.debug(f"Apple App Site Association response: {response_data}")
        
        return JSONResponse(
            content=response_data,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logger.error(f"Error serving Apple App Site Association: {e}", exc_info=True)
        return JSONResponse(
            content={"error": "Internal server error"},
            status_code=500
        )


@deep_links_router.get("/.well-known/assetlinks.json")
async def android_asset_links():
    """
    Android App Links verification file.
    This tells Android which URLs should open your app.
    Note: App Links require HTTPS and a real domain (won't work with localhost).
    For production, this must be accessible at: https://api.evra.opengig.work/.well-known/assetlinks.json
    """
    logger.info("Android Asset Links requested")
    try:
        fingerprints = []
        if ANDROID_SHA256_FINGERPRINT:
            fingerprints.append(ANDROID_SHA256_FINGERPRINT)
            logger.debug(f"Added ANDROID_SHA256_FINGERPRINT (length: {len(ANDROID_SHA256_FINGERPRINT)})")
        if ANDROID_SHA256_FINGERPRINT_EAS:
            fingerprints.append(ANDROID_SHA256_FINGERPRINT_EAS)
            logger.debug(f"Added ANDROID_SHA256_FINGERPRINT_EAS (length: {len(ANDROID_SHA256_FINGERPRINT_EAS)})")
        
        if not fingerprints:
            logger.warning(f"ANDROID_SHA256_FINGERPRINT not configured - ANDROID_SHA256_FINGERPRINT: {bool(ANDROID_SHA256_FINGERPRINT)}, ANDROID_SHA256_FINGERPRINT_EAS: {bool(ANDROID_SHA256_FINGERPRINT_EAS)}")
            return JSONResponse(
                content={"error": "Configuration missing"},
                status_code=500
            )
        
        response_data = [
            {
                "relation": ["delegate_permission/common.handle_all_urls"],
                "target": {
                    "namespace": "android_app",
                    "package_name": ANDROID_PACKAGE,
                    "sha256_cert_fingerprints": fingerprints,
                },
            }
        ]
        
        logger.info(f"Serving Android Asset Links for package: {ANDROID_PACKAGE} with {len(fingerprints)} fingerprint(s)")
        logger.debug(f"Android Asset Links response: {response_data}")
        
        return JSONResponse(
            content=response_data,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logger.error(f"Error serving Android Asset Links: {e}", exc_info=True)
        return JSONResponse(
            content={"error": "Internal server error"},
            status_code=500
        )


# ============================================================================
# DEEP LINK FALLBACK ROUTES
# These serve HTML pages that attempt to open the app
# ============================================================================

@deep_links_router.get("/static/logo.png")
async def serve_logo():
    """
    Serve the Evra app logo.
    Place your logo file at: evra-server/api/static/logo.png
    If the logo doesn't exist, returns a transparent 1x1 PNG.
    """
    # Try multiple possible paths to find the logo
    # In Docker: /app/static/logo.png (root of container)
    # Locally: evra-server/api/static/logo.png
    
    possible_paths = [
        # Docker path (when running in container, root is /app)
        Path("/app") / "static" / "logo.png",
        # Path relative to current file (go up 4 levels: backend -> routers -> app -> api)
        Path(__file__).parent.parent.parent.parent / "static" / "logo.png",
        # Path relative to current file (go up 3 levels: backend -> routers -> app)
        Path(__file__).parent.parent.parent / "static" / "logo.png",
        # Current working directory
        Path.cwd() / "static" / "logo.png",
        # Relative to api directory
        Path(__file__).parent.parent.parent.parent / "static" / "logo.png" if Path(__file__).parent.parent.parent.parent.exists() else None,
    ]
    
    logo_path = None
    for path in possible_paths:
        if path and path.exists():
            logo_path = path
            break
    
    if not logo_path or not logo_path.exists():
        logger.warning(f"Logo not found. Tried paths: {[str(p) for p in possible_paths if p]}")
        logger.warning(f"Current working directory: {Path.cwd()}")
        logger.warning(f"__file__ location: {__file__}")
        # Return a 1x1 transparent PNG as fallback
        transparent_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        return Response(content=transparent_png, media_type="image/png")
    
    logger.info(f"Serving logo from: {logo_path}")
    return FileResponse(logo_path, media_type="image/png")


@deep_links_router.get("/{post_id}", response_class=HTMLResponse)
async def post_id_fallback(post_id: str, request: Request):
    """
    Handle shared post links with direct ID.
    Example: http://localhost:8000/B1X1IpDOcsobzWkpbE (for local testing)
    Example: https://api.evra.opengig.work/B1X1IpDOcsobzWkpbE (for production)
    
    This route handles any path that doesn't match other more specific routes.
    FastAPI will match more specific routes first, so this only catches unmatched paths.
    
    For local testing: You can manually visit http://localhost:8000/{post_id} and the HTML
    page will attempt to open the app via evra://{post_id} deep link.
    """
    logger.info(f"Deep link fallback requested for post_id: {post_id}")
    logger.debug(f"Request URL: {request.url}")
    logger.debug(f"Request path: {request.url.path}")
    logger.debug(f"Request query params: {request.url.query}")
    
    # Skip well-known routes (these are handled by specific routes above)
    if post_id.startswith(".well-known"):
        logger.warning(f"Attempted to access well-known route via catch-all: {post_id}")
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    # Skip delete-account routes (they should be handled above)
    if post_id.startswith("delete-account"):
        logger.warning(f"Delete account route hit catch-all: {post_id}")
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    # Log request details
    user_agent = request.headers.get("user-agent", "")
    logger.debug(f"User-Agent: {user_agent[:200]}...")  # Log first 200 chars
    
    nonce = secrets.token_urlsafe(16)
    logger.debug(f"Generated nonce: {nonce[:20]}...")  # Log first 20 chars
    
    platform = detect_platform(user_agent)
    
    # Deep link is just the ID: evra://{post_id}
    deep_link = f"evra://{post_id}"
    logger.info(f"Generated deep link: {deep_link} for platform: {platform}")
    
    try:
        html = generate_fallback_html(deep_link, platform, nonce, post_id)
        logger.debug(f"Generated HTML fallback page (length: {len(html)} chars)")
        
        response = HTMLResponse(
            content=html,
            headers={
                "Content-Security-Policy": f"script-src 'self' 'nonce-{nonce}';"
            }
        )
        
        logger.info(f"Successfully serving deep link fallback page for post_id: {post_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error generating fallback HTML for post_id {post_id}: {e}", exc_info=True)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Failed to generate fallback page")

