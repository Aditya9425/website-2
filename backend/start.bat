@echo off
echo Starting Shagun Saree Backend Server...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found!
    echo Please create .env file with your Razorpay credentials
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Error: Dependencies not installed!
    echo Please run install.bat first
    pause
    exit /b 1
)

echo Starting server on port 5000...
echo Press Ctrl+C to stop the server
echo.

npm start