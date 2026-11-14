#!/bin/bash
cd /var/www/musicprj
echo "=== Останавливаем PM2 ==="
pm2 delete all
pkill -9 node
sleep 2
fuser -k 3000/tcp
echo "=== Чистим кэш ==="
rm -rf .next
rm -rf node_modules/.cache
echo "=== Сборка (займет 1-2 минуты) ==="
NODE_OPTIONS="--max-old-space-size=4096" npm run build
echo "=== Запуск ==="
pm2 start npm --name "sadovod" -- run start
pm2 start npm --name "worker" -- run worker
pm2 start bot-vps.js --name "parser-bot"
pm2 save
echo "=== Готово! ==="
pm2 status