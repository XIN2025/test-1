import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB_NAME", "evra")
VECTOR_STORE_DB_URI = os.getenv("VECTOR_STORE_DB_URI", "test_vector_store_uri")
VECTOR_COLLECTION_NAME=os.getenv("VECTOR_COLLECTION_NAME", "test_vector_collection")
VECTOR_DB_NAME=os.getenv("VECTOR_DB_NAME", "test_vector_db")
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required for security")
NUDGE_SCHEDULED_COLLECTION = os.getenv("NUDGE_SCHEDULED_COLLECTION", "nudge_scheduled_jobs")

# SMTP/Email Configuration 
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "JetFuel")

# Vector Store Configuration
VECTOR_INDEX_PATH = os.getenv("VECTOR_INDEX_PATH", "faiss_index.bin")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# LLM Configuration
OPENAI_API_KEY = os.getenv("OPENAI_KEY", "test-openai-key")  # Load from OPENAI_KEY in .env
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-5.1")  
LLM_TEMPERATURE = os.getenv("LLM_TEMPERATURE", "0.2")

PERSONALIZATION_MODEL = os.getenv("PERSONALIZATION_MODEL", "ft:o4-mini-2025-04-16:evra-health:user-goals:CfOWayPc")

MEALOGIC_API_KEY = os.getenv("MEALOGIC_API_KEY") 

# Transcription Configuration (using OpenAI Whisper)
# DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")  # Deprecated - now using OpenAI Whisper

# File Upload Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx", ".doc"}
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
PROFILE_PICTURE_MAX_BYTES = int(os.getenv("PROFILE_PICTURE_MAX_BYTES", "10485760"))
ALLOWED_PROFILE_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

MULTIPART_SPOOL_MAX_SIZE = int(os.getenv("MULTIPART_SPOOL_MAX_SIZE", "1048576"))   
MULTIPART_MAX_FILES = int(os.getenv("MULTIPART_MAX_FILES", "10"))  
MULTIPART_MAX_FIELDS = int(os.getenv("MULTIPART_MAX_FIELDS", "20"))  

DEBUG_COLLECTION_NAME = os.getenv("DEBUG_COLLECTION_NAME", "debug_data")

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH_ENV = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")

# Account Deletion Configuration
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://your-app.com")  # Base URL for email links

# Mem0 Configuration
MEM0_API_KEY = os.getenv("MEM0_API_KEY")  # Optional: for hosted Mem0 platform
MEM0_STORAGE_TYPE = os.getenv("MEM0_STORAGE_TYPE", "mongodb")  # mongodb or postgres 

PLEROMA_INSTANCE_URL = os.getenv("PLEROMA_INSTANCE_URL", "http://localhost:4000")
PLEROMA_CLIENT_ID = os.getenv("PLEROMA_CLIENT_ID")
PLEROMA_CLIENT_SECRET = os.getenv("PLEROMA_CLIENT_SECRET")
PLEROMA_CLIENT_NAME = os.getenv("PLEROMA_CLIENT_NAME", "Evra Health")
PLEROMA_REDIRECT_URI = os.getenv("PLEROMA_REDIRECT_URI", "urn:ietf:wg:oauth:2.0:oob")
PLEROMA_SCOPES = os.getenv("PLEROMA_SCOPES", "read write follow push") 
PLEROMA_ADMIN_TOKEN = os.getenv("PLEROMA_ADMIN_TOKEN")
PLEROMA_SECRET_KEY_BASE = os.getenv("PLEROMA_SECRET_KEY_BASE")

# Dexcom Configuration
DEXCOM_CLIENT_ID = os.getenv("DEXCOM_CLIENT_ID", "")
DEXCOM_CLIENT_SECRET = os.getenv("DEXCOM_CLIENT_SECRET", "")
DEXCOM_REDIRECT_URI = os.getenv("DEXCOM_REDIRECT_URI", "http://localhost:8000/api/v1/integrations/dexcom/callback")
# Sandbox URLs (for testing) - Using v3 API
DEXCOM_AUTH_URL = os.getenv("DEXCOM_AUTH_URL", "https://sandbox-api.dexcom.com/v2/oauth2/login")
DEXCOM_TOKEN_URL = os.getenv("DEXCOM_TOKEN_URL", "https://sandbox-api.dexcom.com/v2/oauth2/token")
DEXCOM_DATA_URL = os.getenv("DEXCOM_DATA_URL", "https://sandbox-api.dexcom.com/v3/users/self/egvs")
DEXCOM_DATARANGE_URL = os.getenv("DEXCOM_DATARANGE_URL", "https://sandbox-api.dexcom.com/v3/users/self/dataRange")
