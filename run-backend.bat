@echo off
title TindaMate - FastAPI Backend
echo ========================================================
echo         Starting TindaMate FastAPI Backend Server       
echo ========================================================
cd /d "%~dp0backend"
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found in backend\venv!
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting Uvicorn server on http://localhost:8000...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
