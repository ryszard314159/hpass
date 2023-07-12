#!/bin/bash

cd ~/repos/hpass
git checkout main    # pull the latest code
git pull origin main # from remote repo main branch
rsync -avz --exclude='.git/' --delete ~/repos/hpass/ ~/public_html/

# setup cron job to runevery 1 minute...
# crontab -e to edit 
# * * * * * /bin/bash ~/repos/hpass/utils/pull-from-remote.sh
