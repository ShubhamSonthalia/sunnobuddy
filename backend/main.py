from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import users, mindlog, chat, emotions, reports, intake, voice, therapists

app = FastAPI(title="SunnoBuddy API")

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.frontend_url:
    cleaned_frontend_url = settings.frontend_url.strip().rstrip("/")
    if cleaned_frontend_url and cleaned_frontend_url not in allowed_origins:
        allowed_origins.append(cleaned_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(mindlog.router)
app.include_router(chat.router)
app.include_router(emotions.router)
app.include_router(reports.router)
app.include_router(intake.router)
app.include_router(voice.router)
app.include_router(therapists.router)
