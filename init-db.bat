@echo off
title TindaMate - Database Initializer
echo ========================================================
echo         Initializing TindaMate MySQL Database           
echo ========================================================
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python init_db.py
pause
