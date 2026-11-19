from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import users, mindlog, chat, emotions, reports, intake, voice

app = FastAPI(title="SunnoBuddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
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