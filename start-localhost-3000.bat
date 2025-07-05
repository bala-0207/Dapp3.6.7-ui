@echo off
echo ===============================================
echo Starting ZK-PRET WebApp on localhost:3000
echo ===============================================
echo.
echo Configuration:
echo   - Mode: HTTP (Async)
echo   - Port: 3000 (Changed from 3005)
echo   - URL: http://localhost:3000
echo   - Backend: http://localhost:3001
echo.
echo Features:
echo   ✅ HTTP API calls
echo   ✅ Background job processing
echo   ✅ WebSocket support
echo   ✅ Real-time updates
echo   ✅ All UI components working
echo.

cd /d "%~dp0"

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Building TypeScript...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo TypeScript build failed!
    echo Please check the console for errors.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo Starting server on http://localhost:3000
echo ===============================================
echo.
echo Server will start in HTTP mode with async jobs enabled.
echo Open your browser to: http://localhost:3000
echo.

npm run dev

pause
