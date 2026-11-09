@echo off
setlocal
cd /d "%~dp0"
if exist "runtime\node.exe" goto portable
where node >nul 2>nul
if not errorlevel 1 goto installed
echo First run: downloading portable Node.js from nodejs.org...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ensure-node.ps1"
if errorlevel 1 goto failed
:portable
"%~dp0runtime\node.exe" "%~dp0server.cjs" --open
goto end
:installed
node "%~dp0server.cjs" --open
goto end
:failed
echo Download failed. Install Node.js LTS from https://nodejs.org/ or retry with internet access.
:end
pause
