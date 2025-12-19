@echo off
echo Starting AstraSemi Application...
echo.

REM Check if backend venv exists
if not exist "backend\venv" (
    echo Backend virtual environment not found. Creating...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
)

REM Start backend
echo Starting backend server on http://localhost:5001
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend
echo Starting frontend server on http://localhost:5173
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Backend running on http://localhost:5001
echo Frontend running on http://localhost:5173
echo.
echo Close the terminal windows to stop the servers
pause

