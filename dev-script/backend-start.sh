#!/bin/bash

set -e  # Exit on error

cd /home/ubuntu/dev-code/backend

git pull origin dev

aws ssm get-parameter --name "/COMMON/FIREBASE_FILE" --with-decryption --query "Parameter.Value" --output text > ./firebase-service-account.json

aws ssm get-parameter --name "/DEV/ENV" --with-decryption --query "Parameter.Value" --output text > ./.env

npm install --force

npm run build 

pm2 restart all