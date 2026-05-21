@echo off
cd /d "%~dp0"
node "%~dp0tools\gas-clasp.js" dashboard push
exit /b %ERRORLEVEL%
