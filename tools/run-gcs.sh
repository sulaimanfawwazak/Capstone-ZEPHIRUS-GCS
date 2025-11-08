#!/bin/bash

# ===== Colors =====
COLOR_RED="\033[31m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_BLUE="\033[34m"
COLOR_MAGENTA="\033[35m"
COLOR_CYAN="\033[36m"
RESET="\033[0m"

# ===== Start the WebSocket Server =====
echo -e "${COLOR_GREEN}Starting WebSocket server...${RESET}"
node server/websocket-server.js | sed "s/^/${COLOR_GREEN}[SERVER]${RESET} /" &
SERVER_PID=$!

# ===== Wait a few seconds for the server to initialize =====
sleep 3

# ===== Start the Frontend =====
echo -e "${COLOR_BLUE}Starting GCS Frontend...${RESET}"
npm run dev | sed "s/^/${COLOR_BLUE}[FRONTEND]${RESET} /"

# ===== Stop everything when user exits =====
echo -e "${COLOR_RED}Stopping GCS...${RESET}"
kill $SERVER_PID