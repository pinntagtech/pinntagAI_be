#!/bin/sh

# Env
aws ssm get-parameter --name "/PRODUCTION/ENV" --with-decryption --query "Parameter.Value" --output text > ./.env

# Build 
npm run build

# Start the application
npm run start:prod

