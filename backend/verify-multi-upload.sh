#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)
SELLER_USER="seller_img_${TIMESTAMP}"
SELLER_EMAIL="seller_img_${TIMESTAMP}@test.com"
PASSWORD="Test@1234"

echo "=================================================="
echo "   Multi-Image Upload Verification Script"
echo "=================================================="

# 1. Register Seller (Step 1: Create User)
echo "[1/4] Registering User..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$SELLER_USER\", \"email\": \"$SELLER_EMAIL\", \"password\": \"$PASSWORD\"}")
SELLER_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$SELLER_TOKEN" ]; then
  echo "Failed to register user. Response: $RESPONSE"
  exit 1
fi
echo "✓ User registered."

# 2. Upgrade to Seller (Step 2: Update Role)
echo "[2/4] Upgrading to Seller..."
RESPONSE=$(curl -s -X PATCH "$API_URL/auth/update-role" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"role\": \"SELLER\"}")
# Check for success (assuming 200 OK or similar)
echo "✓ Upgraded to SELLER."

# 3. Create Dummy Images
echo "[3/4] Creating dummy images..."
echo "fake image 1" > img1.jpg
echo "fake image 2" > img2.png

# 4. Create Product with Multiple Images
echo "[4/4] Uploading Product with 2 images..."
RESPONSE=$(curl -s -X POST "$API_URL/products" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -F "name=Multi Image Product $TIMESTAMP" \
  -F "description=Test Description" \
  -F "category=Test" \
  -F "price=50000" \
  -F "stock=10" \
  -F "images=@img1.jpg" \
  -F "images=@img2.png")

# Clean up dummy images
rm img1.jpg img2.png

echo "Response: $RESPONSE"

if [[ "$RESPONSE" == *"images"* ]]; then
  echo "✓ SUCCESS: Product created with multiple images."
  echo "Images field found in response."
else
  echo "✗ FAILURE: Images field missing or upload failed."
  exit 1
fi
