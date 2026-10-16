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

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

MISSING=""

if ! command -v bun &> /dev/null; then
    echo "${RED}✗ Bun not installed${NC}"
    MISSING="${MISSING}bun "
else
    echo "${GREEN}✓ Bun installed${NC}"
fi

if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js not installed${NC}"
    MISSING="${MISSING}node "
else
    echo "${GREEN}✓ Node.js installed${NC}"
fi

if ! command -v psql &> /dev/null; then
    echo "${RED}✗ PostgreSQL not installed${NC}"
    MISSING="${MISSING}postgresql "
else
    echo "${GREEN}✓ PostgreSQL installed${NC}"
fi

if ! command -v redis-server &> /dev/null; then
    echo "${RED}✗ Redis not installed${NC}"
    MISSING="${MISSING}redis "
else
    echo "${GREEN}✓ Redis installed${NC}"
fi

if [ ! -z "$MISSING" ]; then
    echo ""
    echo "${RED}Missing dependencies. Install with:${NC}"
    echo "  brew install ${MISSING}"
    exit 1
fi

echo ""
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
echo "🔴 Checking Redis..."
if ! command -v redis-server &> /dev/null; then
    echo "${RED}✗ Redis not installed${NC}"
    echo ""
    echo "Install Redis:"
    echo "  brew install redis"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "Starting Redis..."
if redis-cli ping &> /dev/null; then
    echo "${GREEN}✓ Redis already running${NC}"
else
    redis-server --daemonize yes
    sleep 1
    echo "${GREEN}✓ Redis started on port 6379${NC}"
fi

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
