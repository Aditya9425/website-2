@echo off
echo Installing Shagun Saree Backend Dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing npm dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ✅ Installation completed successfully!
echo.
echo To start the server:
echo   npm start     (production)
echo   npm run dev   (development with auto-reload)
echo.
pause