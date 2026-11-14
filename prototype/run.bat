@echo off
cd /d "%~dp0"
python -m pip install -r requirements.txt
if not exist .env copy .env.example .env
python -m uvicorn app.main:app --port 8000
pause4
