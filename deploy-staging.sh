#!/bin/bash

REPO="founders-form-monorepo"
echo "$HOME/$REPO"
cd "$HOME/$REPO"
sudo su


echo "📥 Pulling latest code..."
git checkout staging
git pull

echo "🔨 Building Docker images..."
export COMPOSE_BAKE=true
docker compose up --build -d