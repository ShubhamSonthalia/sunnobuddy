from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    firebase_project_id: str
    google_application_credentials: str = ""
    gemini_api_key: str = ""
    encryption_master_key: str = ""
    frontend_url: str = "https://sunnobuddy-frontend-development.vercel.app/"
    gemini_model: str = "models/gemini-3.5-flash-lite"
    gemini_live_model: str = "gemini-3.8-live"
    gemini_voice: str = "Aoede"

settings = Settings()