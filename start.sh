#!/usr/bin/env bash

# ==============================================================================
# ⚖️ Legal Contract Q&A Assistant Startup Script
# ==============================================================================
# This script sets up the environment, installs dependencies, and runs both 
# the FastAPI backend and React/Vite frontend concurrently.
# ==============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}================================================================"
echo -e "      ⚖️  LEGAL CONTRACT Q&A ASSISTANT — STARTUP SCRIPT"
echo -e "================================================================${NC}"

# Get the absolute path of the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/legal-contract-qa"

# Function to check dependencies
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: '$1' is not installed. Please install it and try again.${NC}"
        exit 1
    fi
}

echo -e "\n${BLUE}[1/5] Checking system dependencies...${NC}"
check_dependency "python3"
check_dependency "node"
check_dependency "npm"
echo -e "${GREEN}✓ All basic system dependencies are present.${NC}"

# Check for backend setup
echo -e "\n${BLUE}[2/5] Setting up Backend Environment...${NC}"
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo -e "${YELLOW}Creating virtual environment in $BACKEND_DIR/.venv...${NC}"
    python3 -m venv "$BACKEND_DIR/.venv"
fi

# Activate virtual environment
source "$BACKEND_DIR/.venv/bin/activate"

# Upgrade pip and install dependencies
echo -e "${YELLOW}Installing/updating Python dependencies...${NC}"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"
echo -e "${GREEN}✓ Python environment set up successfully.${NC}"

# Check backend configuration
echo -e "\n${BLUE}[3/5] Verifying Backend Configuration (.env)...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    else
        echo -e "${RED}Error: backend/.env.example not found. Please create backend/.env manually.${NC}"
        exit 1
    fi
fi

# Load backend .env to inspect API Key
if grep -q "GEMINI_API_KEY=your-gemini-api-key-here" "$BACKEND_DIR/.env" || grep -q "GEMINI_API_KEY=\s*$" "$BACKEND_DIR/.env"; then
    echo -e "${RED}⚠️ WARNING: GEMINI_API_KEY is not configured in backend/.env!${NC}"
    echo -e "${YELLOW}Please open backend/.env and replace 'your-gemini-api-key-here' with your real Google Gemini API Key.${NC}"
fi

# Check for frontend setup
echo -e "\n${BLUE}[4/5] Setting up Frontend Environment...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR" || exit 1
    echo -e "${YELLOW}Installing npm packages...${NC}"
    npm install
    
    # Check frontend .env
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating frontend .env file...${NC}"
        echo "VITE_SUPABASE_URL=https://iqvspttbvqfueyqdseok.supabase.co" > .env
        echo "VITE_SUPABASE_ANON_KEY=sb_publishable_qOKnfRRVmKxWlTX9M1PVBA_BxfBiB56" >> .env
        echo -e "${GREEN}Created default frontend/.env pointing to Supabase.${NC}"
    fi
    echo -e "${GREEN}✓ Frontend environment set up successfully.${NC}"
else
    echo -e "${RED}Error: Frontend directory $FRONTEND_DIR not found.${NC}"
    exit 1
fi

# Start processes
echo -e "\n${BLUE}[5/5] Launching Servers...${NC}"

# Return to root directory
cd "$PROJECT_ROOT" || exit 1

# Flag to keep track of child PIDs
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function to kill background processes on exit (e.g. Ctrl+C)
cleanup() {
    echo -e "\n\n${YELLOW}Stopping servers...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        echo -e "Stopping backend server (PID $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        echo -e "Stopping frontend server (PID $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    echo -e "${GREEN}Servers stopped. Goodbye!${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}Starting FastAPI backend in the background...${NC}"
cd "$BACKEND_DIR" || exit 1
source .venv/bin/activate
# Suppress macOS OpenMP warning
export KMP_DUPLICATE_LIB_OK="TRUE"
python run.py > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}FastAPI backend started (PID: $BACKEND_PID). Logs are being written to backend.log${NC}"

# Start frontend
echo -e "${YELLOW}Starting React/Vite frontend...${NC}"
cd "$FRONTEND_DIR" || exit 1
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Vite frontend started (PID: $FRONTEND_PID).${NC}"

# Display service access links
echo -e "\n${GREEN}================================================================"
echo -e "🚀 System is running!"
echo -e "🌐 Frontend: http://localhost:5173"
echo -e "🔌 Backend API: http://localhost:8000"
echo -e "📑 Backend docs: http://localhost:8000/docs"
echo -e "📝 Backend log: tail -f backend.log"
echo -e "================================================================${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers at any time.${NC}\n"

# Wait for background processes to keep script alive
wait "$FRONTEND_PID" "$BACKEND_PID"
