@echo off
title TindaMate Dev Launcher
echo ========================================================
echo               TindaMate Full-Stack Launcher             
echo ========================================================
echo Launching Backend (FastAPI on http://localhost:8000)...
start "TindaMate Backend" cmd /k "%~dp0run-backend.bat"

echo Launching Frontend (React + Vite on http://localhost:5173)...
start "TindaMate Frontend" cmd /k "%~dp0run-frontend.bat"

echo.
echo Both servers are launching in separate windows!
echo Frontend: http://localhost:5173
echo Backend API & Docs: http://localhost:8000/docs
echo ========================================================
pause
