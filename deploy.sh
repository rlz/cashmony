#!/bin/sh

npm run build-server || exit 1
npm run build-client || exit 1
rsync -r auth dist cashmony.service cashmony:/cashmony/ || exit 1
rsync -r --delete ./front/dist/ cashmony:/cashmony/web || exit 1

ssh cashmony 'cp -f /cashmony/cashmony.service /lib/systemd/system/cashmony.service'
ssh cashmony 'systemctl daemon-reload'
ssh cashmony 'systemctl restart cashmony'
ssh cashmony 'systemctl status cashmony'
