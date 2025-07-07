#!/bin/bash

# DeepSeaGuard Real-Time System Startup Script
# This script starts both backend and frontend for development

echo "🌊 Starting DeepSeaGuard Real-Time Compliance Platform..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start Backend
echo "🚀 Starting Backend (Real-Time Data Engine)..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

# Start backend in background
echo "🔌 Starting WebSocket backend server..."
python src/main.py &
BACKEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "📡 WebSocket endpoint: ws://localhost:5000"
echo "🌐 REST API: http://localhost:5000/api/"
echo ""

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend (Dashboard)..."
cd ../frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Start frontend
echo "🖥️ Starting React development server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "🌐 Dashboard: http://localhost:5173"
echo ""

echo "🎉 DeepSeaGuard is now running!"
echo "=================================================="
echo "📊 Dashboard: http://localhost:5173"
echo "📡 Backend API: http://localhost:5000/api/health"
echo "🎬 Demo Controls: Available in development mode"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping DeepSeaGuard services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait

