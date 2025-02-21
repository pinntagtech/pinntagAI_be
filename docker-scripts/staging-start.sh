#!/bin/sh

# Env
aws ssm get-parameter --name "/STAGING/ENV" --with-decryption --query "Parameter.Value" --output text > ./.env

# Build 
npm run build

# Start the application
npm run start:staging
