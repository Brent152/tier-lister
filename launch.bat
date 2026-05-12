@echo off
cd /d "C:\Users\brent_69v9d11\Documents\Github\tier-lister"
start "Tier Lister Dev Server" cmd /k npm run dev
timeout /t 4 /nobreak >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
if errorlevel 1 start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
