import Config

# Enable DB config persistence
config :pleroma, configurable_from_database: true

# Endpoint (binds to all interfaces on port 4000)
config :pleroma, Pleroma.Web.Endpoint,
  url: [host: "api.evra.opengig.work", scheme: "https", port: 443],
  http: [ip: {0, 0, 0, 0}, port: 4000],
  secret_key_base: "BO1ICzds3sce5Xa3KkYFtoX5A1P6YhL8VsKBDfgINNMxV0+D9mcAGUL+wJCU+EEH"

# Instance settings (your Evra community)
config :pleroma, :instance,
  name: "Evra Health Community",
  email: "admin@localhost",
  notify_email: "noreply@localhost",
  limit: 5000,
  registrations_open: true,
  invites_enabled: false,
  account_activation_required: false,
  account_approval_required: false,
  federating: false,
  skip_thread_containment: true,
  allowed_post_formats: ["text/plain", "text/html", "text/markdown", "text/bbcode"],
  autofollowed_nicknames: [],
  max_pinned_statuses: 3,
  attachment_links: false,
  max_report_comment_size: 1000,
  safe_dm_mentions: false,
  healthcheck: false,
  remote_post_retention_days: 90,
  registration_reason_length: 0

# Disable CAPTCHA for dev
config :pleroma, Pleroma.Captcha, enabled: false

# Disable email notifications
config :pleroma, :email_notifications, enabled: false

# Media proxy (simple)
config :pleroma, :media_proxy, enabled: true, redirect_on_failure: true

# Upload configuration - THIS IS THE KEY PART
config :pleroma, Pleroma.Upload,
  uploader: Pleroma.Uploaders.Local,
  filters: [Pleroma.Upload.Filter.Dedupe],
  link_name: false,
  proxy_remote: false,
  proxy_opts: [
    redirect_on_failure: false,
    max_body_length: 25 * 1_048_576,
    http: [
      follow_redirect: true,
      pool: :media
    ]
  ],
  base_url: "https://api.evra.opengig.work/media"

# Database (points to postgres service)
config :pleroma, Pleroma.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "pleroma",
  password: "pleroma",
  database: "pleroma",
  hostname: "postgres",
  pool_size: 10

config :pleroma, :database, rum_enabled: false

# Static/Uploads dirs (volume-mounted)
config :pleroma, :instance, static_dir: "/var/lib/pleroma/static"
config :pleroma, Pleroma.Uploaders.Local, uploads: "/var/lib/pleroma/uploads"

# Rate limiting (disabled for dev)
config :pleroma, :rate_limit,
  authentication: nil,
  timeline: nil,
  search: nil,
  app_account_creation: nil,
  relations_actions: nil,
  relation_id_action: nil,
  statuses_actions: nil,
  status_id_action: nil

# CORS (for your FastAPI on :8000)
config :cors_plug,
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  expose: ["Link", "X-RateLimit-Reset", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-Request-Id"],
  credentials: true,
  headers: ["Authorization", "Content-Type", "Idempotency-Key"]

config :pleroma, :cors_plug,
  enabled: true,
  credentials: true,
  headers: ["*"]
