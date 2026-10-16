#!/bin/bash

echo "========================================="
echo "Stopping Messages VC services..."
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🛑 Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
        echo "${GREEN}✓ Backend stopped${NC}"
    else
        echo "${RED}Backend process not found${NC}"
        rm logs/backend.pid
    fi
else
    echo "No backend PID file found"
fi

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🛑 Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
        echo "${GREEN}✓ Frontend stopped${NC}"
    else
        echo "${RED}Frontend process not found${NC}"
        rm logs/frontend.pid
    fi
else
    echo "No frontend PID file found"
fi

# Stop Redis
echo "🛑 Stopping Redis..."
redis-cli shutdown 2>/dev/null || echo "Redis already stopped"
echo "${GREEN}✓ Redis stopped${NC}"

# Kill any remaining node/bun processes on ports 3000 and 5173
echo ""
echo "Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo "${GREEN}✓ All services stopped${NC}"
echo ""
