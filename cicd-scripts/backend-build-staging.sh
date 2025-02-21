#!/bin/bash

set -e  # Exit on error

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region "us-east-1" | docker login --username AWS --password-stdin "692859910391.dkr.ecr.us-east-1.amazonaws.com"

echo "Fetching latest tag from ECR..."
LATEST_TAG=$(aws ecr describe-images --repository-name staging-pinntag-backend --region us-east-1   --query 'sort_by(imageDetails[?imageTags!=null], &imagePushedAt)[-1].imageTags[0]' --output text)
echo "Latest tag retrieved: $LATEST_TAG"

LATEST_TAG=${LATEST_TAG:-0}  # Ensure it's not empty
NEXT_TAG=$((LATEST_TAG + 1))
echo "Next image tag: $NEXT_TAG"

echo "Building the Docker image..."
docker build -t staging-pinntag-backend:"$NEXT_TAG" . -f ./Dockerfile-staging

echo "Tagging and pushing image to ECR..."
docker tag staging-pinntag-backend:"$NEXT_TAG" "692859910391.dkr.ecr.us-east-1.amazonaws.com/staging-pinntag-backend":"$NEXT_TAG"
docker push "692859910391.dkr.ecr.us-east-1.amazonaws.com/staging-pinntag-backend":"$NEXT_TAG"

echo "Docker image pushed successfully with tag: $NEXT_TAG"
