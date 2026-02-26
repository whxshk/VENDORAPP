#!/bin/bash
# 1. Cleanup old files from last session
rm -rf ./tmp ./temp_buffer
mkdir tmp temp_buffer
# 2. Kill existing Jackett or Middleware instances to prevent "address in use" errors
pkill -f jackett || true
pkill -f "ts-node server.ts" || true

# 3. Start Jackett and Middleware
cd "/Users/tbm/Downloads/Jackett" && ./jackett &
cd "/Users/tbm/Documents/New project/streamshelf/middleware" && npx ts-node server.ts
