#!/bin/bash

echo "============================================"
echo "  Portfolio Backend - First Time Setup"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "[STEP 1] Creating .env file..."
    cp backend/.env.example backend/.env
    echo ""
    echo "✅ .env file created!"
    echo "⚠️  IMPORTANT: Edit backend/.env with your settings:"
    echo "   - MongoDB connection string"
    echo "   - Gmail credentials"
    echo "   - Admin password"
    echo ""
    read -p "Press enter to continue..."
else
    echo "[STEP 1] .env file already exists ✓"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "[STEP 2] Installing dependencies..."
    echo "This may take a minute..."
    echo ""
    cd backend && npm install
    if [ $? -ne 0 ]; then
        echo "❌ Installation failed!"
        exit 1
    fi
    echo ""
    echo "✅ Dependencies installed!"
    echo ""
    cd ..
else
    echo "[STEP 2] Dependencies already installed ✓"
    echo ""
fi

echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your credentials"
echo "  2. Run: cd backend && npm run dev"
echo "  3. Open http://localhost:5000 in browser"
echo ""
echo "Need help? Check SETUP_GUIDE.md"
echo ""
