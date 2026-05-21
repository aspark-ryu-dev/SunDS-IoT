@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0data-deploy.ps1"
exit /b %ERRORLEVEL%
