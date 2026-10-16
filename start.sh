#!/bin/bash

set -e

echo "========================================="
echo "Messages VC - Ultra-fast Messaging"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if database exists
echo "📊 Checking PostgreSQL..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw vc_messages; then
    echo "${YELLOW}Creating database vc_messages...${NC}"
    createdb vc_messages
    echo "${GREEN}✓ Database created${NC}"
else
    echo "${GREEN}✓ Database exists${NC}"
fi

# Check Redis
echo ""
echo "🔴 Starting Redis..."
redis-server --daemonize yes
sleep 1
echo "${GREEN}✓ Redis running on port 6379${NC}"

# Backend setup
echo ""
echo "⚡ Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    bun install
fi

# Push database schema
echo "Pushing database schema..."
bun run db:push

# Start backend
echo "${GREEN}Starting backend server...${NC}"
bun run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
sleep 2

cd ..

# Frontend setup
echo ""
echo "⚛️  Setting up Frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "${GREEN}Starting frontend server...${NC}"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
sleep 3

cd ..

# Summary
echo ""
echo "========================================="
echo "${GREEN}✓ All services started successfully!${NC}"
echo "========================================="
echo ""
echo "📡 Backend:   http://localhost:3000"
echo "🌐 Frontend:  http://localhost:5173"
echo "🔌 WebSocket: ws://localhost:3000/ws"
echo "🔴 Redis:     localhost:6379"
echo "📊 PostgreSQL: localhost:5432/vc_messages"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo ""
