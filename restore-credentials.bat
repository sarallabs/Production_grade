@echo off
title Restore SaralVidhya Environment Credentials
echo ========================================================
echo  Restoring .env files and Firebase Service Account keys
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore-credentials.ps1"
echo.
pause
