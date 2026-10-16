#!/bin/bash

echo "========================================="
echo "Messages VC - Service Status"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check backend
echo -n "⚡ Backend (port 3000):  "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check frontend
echo -n "⚛️  Frontend (port 5173): "
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Redis
echo -n "🔴 Redis (port 6379):    "
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check PostgreSQL
echo -n "📊 PostgreSQL:            "
if psql -lqt >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    echo -n "   Database vc_messages: "
    if psql -lqt | cut -d \| -f 1 | grep -qw vc_messages; then
        echo -e "${GREEN}✓ Exists${NC}"
    else
        echo -e "${RED}✗ Not found${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo ""
echo "URLs:"
echo "  Backend:   http://localhost:3000"
echo "  Frontend:  http://localhost:5173"
echo ""
