@echo off
echo ============================================
echo   Portfolio Backend - First Time Setup
echo ============================================
echo.

REM Check if .env exists
if not exist .env (
    echo [STEP 1] Creating .env file...
    copy .env.example .env
    echo.
    echo ✅ .env file created!
    echo ⚠️  IMPORTANT: Edit .env file with your settings:
    echo    - MongoDB connection string
    echo    - Gmail credentials
    echo    - Admin password
    echo.
    pause
) else (
    echo [STEP 1] .env file already exists ✓
    echo.
)

REM Check if node_modules exists
if not exist node_modules (
    echo [STEP 2] Installing dependencies...
    echo This may take a minute...
    echo.
    call npm install
    echo.
    if %errorlevel% neq 0 (
        echo ❌ Installation failed!
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed!
    echo.
) else (
    echo [STEP 2] Dependencies already installed ✓
    echo.
)

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Edit backend\.env with your credentials
echo   2. Run: npm run dev
echo   3. Open http://localhost:5000 in browser
echo.
echo Need help? Check SETUP_GUIDE.md
echo.
pause
