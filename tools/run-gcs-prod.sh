#!/bin/bash

# ===== Colors =====
COLOR_RED=$(printf '\033[31m')
COLOR_GREEN=$(printf '\033[32m')
COLOR_YELLOW=$(printf '\033[33m')
COLOR_BLUE=$(printf '\033[34m')
COLOR_MAGENTA=$(printf '\033[35m')
COLOR_CYAN=$(printf '\033[36m')
RESET=$(printf '\033[0m')

RUN_FRONTEND=true
RUN_BACKEND=true

if [ "$1" == "--frontend" ]; then
  RUN_BACKEND=false
elif [ "$1" == "--backend"]; then
  RUN_FRONTEND=false
fi

# ===== Start the WebSocket Server =====
if [ "$RUN_BACKEND" == true ]; then
  echo -e "${COLOR_GREEN}Starting WebSocket server...${RESET}"
  node server/websocket-server.js | sed "s/^/${COLOR_GREEN}[SERVER]${RESET} /" &
  SERVER_PID=$!
  sleep 3 # Wait a few seconds for the server to initialize
fi

# ===== Start the Frontend =====
if [ "$RUN_FRONTEND" == true ]; then
  echo -e "${COLOR_GREEN}Starting GCS Frontend...${RESET}"
  npm start | sed "s/^/${COLOR_BLUE}[FRONTEND]${RESET} /"
fi

# ===== Stop everything when user exits =====
if [ "$RUN_BACKEND" == true ]; then
  echo -e "${COLOR_RED}Stopping GCS backend...${RESET}"
  kill $SERVER_PID
fi