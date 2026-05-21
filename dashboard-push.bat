@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dashboard-push.ps1"
exit /b %ERRORLEVEL%
