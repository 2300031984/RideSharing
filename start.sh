#!/bin/bash

echo "Starting Ride Sharing Application..."
echo

echo "Starting Backend (Spring Boot)..."
cd ridesharing
mvn spring-boot:run &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 10

echo "Starting Frontend (React)..."
cd ../Forntend/RideSharing
npm run dev &
FRONTEND_PID=$!

echo
echo "Application is starting up!"
echo "Backend will be available at: http://localhost:8081"
echo "Frontend will be available at: http://localhost:5173"
echo
echo "Press Ctrl+C to stop all services"

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
