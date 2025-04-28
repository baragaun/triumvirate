#!/bin/sh

OLD_PATH=$(pwd)
cd ~/apps/triumvirate
nvm use
pnpm install
pnpm run build
cd ..
pm2 start ecosystem.config.cjs
cd $OLD_PATH
pm2 logs
