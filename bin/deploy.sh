#!/usr/bin/env bash

# This assumes:
# 1. The remote host's name is `ai-chat`
# 2. The remote user's name is `ubuntu`
# 3. The app is in `~/apps/triumvirate` on the remote host
# 4. The remote host has the file `~/bin/deploy.sh`

rsync -avPe ssh --delete --exclude-from=bin/exclude.txt ./ ai-chat:apps/triumvirate/
ssh ai-chat 'sh /home/ubuntu/bin/deploy.sh'
