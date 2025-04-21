#!/usr/bin/env bash

rsync -avPe ssh --delete --exclude-from=bin/exclude.txt ./ ai-chat:apps/triumvirate/
ssh ai-chat 'cd ~/apps/triumvirate && pnpm install && pnpm run build && pm2 restart triumvirate'
