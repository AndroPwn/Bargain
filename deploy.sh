#!/bin/bash
set -e

echo "=== EcoLoop / Barter Deployment Script ==="

# Check Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker installed. Please log out and back in, then run this script again."
  exit 0
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  echo "Installing docker-compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Prompt for VPS IP if not set
if grep -q "YOUR_VPS_IP" .env; then
  read -p "Enter your VPS public IP address: " VPS_IP
  sed -i "s/YOUR_VPS_IP/$VPS_IP/g" .env
  echo "Updated .env with IP: $VPS_IP"
fi

# Create uploads dir
mkdir -p uploads

echo "Starting containers..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

echo ""
echo "=== Done! ==="
API_URL=$(grep '^VITE_API_URL=' .env | cut -d'=' -f2)
FRONTEND_URL=$(echo "$API_URL" | sed 's/:3001$/:5173/')
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $API_URL"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"
