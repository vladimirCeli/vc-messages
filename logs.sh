#!/bin/bash

echo "========================================="
echo "Messages VC - Logs Viewer"
echo "========================================="
echo ""
echo "Select logs to view:"
echo "1) Backend"
echo "2) Frontend"
echo "3) Both (split screen)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "Showing backend logs (Ctrl+C to exit)..."
        tail -f logs/backend.log
        ;;
    2)
        echo "Showing frontend logs (Ctrl+C to exit)..."
        tail -f logs/frontend.log
        ;;
    3)
        echo "Showing both logs (Ctrl+C to exit)..."
        tail -f logs/backend.log logs/frontend.log
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
