@echo off
echo ===============================================
echo ZK-PRET Port 3000 Configuration Validator
echo ===============================================
echo.

cd /d "%~dp0"

echo Checking .env configuration...
findstr /R "HTTP_PORT=3000" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ HTTP_PORT correctly set to 3000
) else (
    echo ❌ HTTP_PORT not set to 3000
    echo Current value:
    findstr "HTTP_PORT" .env
)

findstr /R "ZK_PRET_WEB_APP_PORT=3000" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ ZK_PRET_WEB_APP_PORT correctly set to 3000
) else (
    echo ❌ ZK_PRET_WEB_APP_PORT not set to 3000
    echo Current value:
    findstr "ZK_PRET_WEB_APP_PORT" .env
)

findstr /R "CORS_ORIGIN=http://localhost:3000" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ CORS_ORIGIN correctly set to localhost:3000
) else (
    echo ❌ CORS_ORIGIN not correctly configured
    echo Current value:
    findstr "CORS_ORIGIN" .env
)

findstr /R "OPERATION_MODE=HTTP" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ OPERATION_MODE correctly set to HTTP
) else (
    echo ❌ OPERATION_MODE not set to HTTP
    echo Current value:
    findstr "OPERATION_MODE" .env
)

echo.
echo Checking for any remaining port 3005 references...
findstr /R "3005" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ❌ Found references to port 3005:
    findstr "3005" .env
) else (
    echo ✅ No references to port 3005 found
)

echo.
echo Checking server files...
if exist "src\async-server.ts" (
    echo ✅ async-server.ts exists
) else (
    echo ❌ async-server.ts not found
)

if exist "src\server.ts" (
    echo ✅ server.ts exists
) else (
    echo ❌ server.ts not found
)

echo.
echo ===============================================
echo Configuration Check Complete
echo ===============================================
echo.
echo If all checks show ✅, your app is ready to run on port 3000
echo Run: start-localhost-3000.bat to start the server
echo.

pause
