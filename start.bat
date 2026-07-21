@echo off
title NearestDoctor - Launcher
color 0A

echo.
echo  ==========================================
echo   NearestDoctor - Starting All Services
echo  ==========================================
echo.

:: Kill anything already on these ports
echo [1/4] Cleaning up ports 3001, 8080, 8081...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081 " ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1
echo     Done.
echo.

:: Start Blockchain Node
echo [2/4] Starting Blockchain Node on port 3001...
start "Blockchain Node :3001" cmd /k "cd /d %~dp0blockchain && echo Starting Blockchain... && node src/server/node-server.js 3001 http://localhost:3001"
echo     Blockchain window opened.
echo.

:: Wait 2 seconds
ping -n 3 127.0.0.1 >nul

:: Start Backend Server
echo [3/4] Starting Backend Server on port 8080...
start "Backend Server :8080" cmd /k "cd /d %~dp0server && echo Starting Backend Server... && node server.js"
echo     Backend window opened.
echo.

:: Wait 3 seconds for backend to connect to MongoDB
ping -n 4 127.0.0.1 >nul

:: Start React Frontend
echo [4/4] Starting React Frontend on port 8081...
start "React Frontend :8081" cmd /k "cd /d %~dp0react-app && echo Starting React App... && npm start"
echo     React window opened.
echo.

echo  ==========================================
echo   All services are starting up!
echo  ==========================================
echo.
echo   Blockchain  ->  http://localhost:3001
echo   Backend     ->  http://localhost:8080
echo   Frontend    ->  http://localhost:8081
echo.
echo   Opening browser in 10 seconds...
echo   (Close this window anytime)
echo.

ping -n 11 127.0.0.1 >nul
start http://localhost:8081

echo   Browser opened. You can close this window.
pause
