@echo off
echo Starting Ride Sharing Application...
echo.

echo Checking if Java is installed...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16 or higher
    pause
    exit /b 1
)

echo Starting Backend (Spring Boot)...
start "Backend" cmd /k "cd ridesharing && mvn spring-boot:run"

echo Waiting for backend to start...
timeout /t 15 /nobreak > nul

echo Starting Frontend (React)...
start "Frontend" cmd /k "cd Forntend\RideSharing && npm run dev"

echo.
echo Application is starting up!
echo Backend will be available at: http://localhost:8081
echo Frontend will be available at: http://localhost:5173
echo.
echo If you see any errors, check the console windows that opened.
echo.
echo Press any key to exit...
pause > nul
