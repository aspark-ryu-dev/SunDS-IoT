@echo off
cd /d "%~dp0"
node "%~dp0tools\gas-clasp.js" data push
exit /b %ERRORLEVEL%
