#!/usr/bin/env zsh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install from https://brew.sh and rerun."
  exit 1
fi

brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
brew list nvm >/dev/null 2>&1 || brew install nvm

export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"

if [ -s "$(brew --prefix nvm)/nvm.sh" ]; then
  source "$(brew --prefix nvm)/nvm.sh"
fi

nvm install 22
nvm use 22

if [ ! -f .env ]; then
  cp .env.example .env
fi

npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npx playwright install chromium

echo "StreamShelf setup complete. Run: npm run dev"
