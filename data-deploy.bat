@echo off
cd /d "%~dp0"
node "%~dp0tools\gas-clasp.js" data deploy %*
exit /b %ERRORLEVEL%
