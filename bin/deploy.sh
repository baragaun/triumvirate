#!/usr/bin/env bash

rsync -avPe ssh --delete --exclude-from=bin/exclude.txt ./ ai-chat:apps/triumvirate/
ssh ai-chat 'cd ~/apps/triumvirate && nvm use && pnpm install && pnpm run build && cd .. && pm2 start ecosystem.config.cjs'
