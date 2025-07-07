@echo off
REM DeepSeaGuard Real-Time System Startup Script for Windows
REM This script starts both backend and frontend for development

echo 🌊 Starting DeepSeaGuard Real-Time Compliance Platform...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.11+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Start Backend
echo 🚀 Starting Backend (Real-Time Data Engine)...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo 📦 Installing backend dependencies...
pip install -r requirements.txt

REM Start backend in background
echo 🔌 Starting WebSocket backend server...
start /b python src/main.py

echo ✅ Backend started
echo 📡 WebSocket endpoint: ws://localhost:5000
echo 🌐 REST API: http://localhost:5000/api/
echo.

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 🎨 Starting Frontend (Dashboard)...
cd ..\frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Start frontend
echo 🖥️ Starting React development server...
start /b npm run dev

echo ✅ Frontend started
echo 🌐 Dashboard: http://localhost:5173
echo.

echo 🎉 DeepSeaGuard is now running!
echo ==================================================
echo 📊 Dashboard: http://localhost:5173
echo 📡 Backend API: http://localhost:5000/api/health
echo 🎬 Demo Controls: Available in development mode
echo.
echo Press any key to open dashboard in browser...
pause >nul

REM Open dashboard in default browser
start http://localhost:5173

echo.
echo Press any key to stop all services...
pause >nul

