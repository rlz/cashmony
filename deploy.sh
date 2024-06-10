#!/bin/sh

npm run build-server || exit 1
npm run build-client || exit 1
rsync -r auth cashmony.cjs cashmony.service cashmony:/cashmony/ || exit 1
rsync -r --delete dist/ cashmony:/cashmony/web || exit 1

ssh cashmony 'sudo cp -f /cashmony/cashmony.service /lib/systemd/system/cashmony.service'
ssh cashmony 'sudo systemctl daemon-reload'
ssh cashmony 'sudo systemctl restart cashmony'
ssh cashmony 'sudo systemctl status cashmony'
