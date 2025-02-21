#!/bin/bash

BUILD_NUMBER=$(aws ecr describe-images --repository-name staging-pinntag-backend --region us-east-1   --query 'sort_by(imageDetails[?imageTags!=null], &imagePushedAt)[-1].imageTags[0]' --output text)

cd /home/ubuntu/pinntag/staging/

docker-compose -f /home/ubuntu/pinntag/staging/docker-compose.yaml down

# Display the docker-compose file content
cat /home/ubuntu/pinntag/staging/docker-compose.yaml

sed -i "s+692859910391.dkr.ecr.us-east-1.amazonaws.com/staging-pinntag-backend.*+692859910391.dkr.ecr.us-east-1.amazonaws.com/staging-pinntag-backend:"${BUILD_NUMBER}"+g" /home/ubuntu/pinntag/staging/docker-compose.yaml

cat /home/ubuntu/pinntag/staging/docker-compose.yaml

whoami
