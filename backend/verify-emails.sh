#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)
SELLER_USER="seller_${TIMESTAMP}"
SELLER_EMAIL="seller_${TIMESTAMP}@test.com"
BUYER_USER="buyer_${TIMESTAMP}"
BUYER_EMAIL="buyer_${TIMESTAMP}@test.com"
PASSWORD="Test@1234"

echo "=================================================="
echo "   Email Notification Verification Script"
echo "=================================================="
echo "This script will simulate a full e-commerce flow to trigger emails."
echo "Ensure your backend is running at $API_URL"
echo "--------------------------------------------------"

# 1. Register Seller
echo "[1/7] Registering Seller ($SELLER_USER)..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$SELLER_USER\", \"email\": \"$SELLER_EMAIL\", \"password\": \"$PASSWORD\", \"role\": \"SELLER\"}")
SELLER_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$SELLER_TOKEN" ]; then
  echo "Failed to register seller. Response: $RESPONSE"
  exit 1
fi
echo "✓ Seller registered."

# 2. Register Buyer
echo "[2/7] Registering Buyer ($BUYER_USER)..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$BUYER_USER\", \"email\": \"$BUYER_EMAIL\", \"password\": \"$PASSWORD\"}")
BUYER_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$BUYER_TOKEN" ]; then
  echo "Failed to register buyer. Response: $RESPONSE"
  exit 1
fi
echo "✓ Buyer registered."

# 3. Seller Creates Product
echo "[3/7] Creating Product (Stock: 12)..."
RESPONSE=$(curl -s -X POST "$API_URL/products" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Product $TIMESTAMP\", \"description\": \"Test Description\", \"category\": \"Electronics\", \"price\": 100000, \"stock\": 12}")
PRODUCT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
  echo "Failed to create product. Response: $RESPONSE"
  exit 1
fi
echo "✓ Product created (ID: $PRODUCT_ID)."

# 4. Buyer Adds to Cart
echo "[4/7] Buyer adding to cart (Qty: 3)..."
curl -s -X POST "$API_URL/cart" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": \"$PRODUCT_ID\", \"quantity\": 3}" > /dev/null
echo "✓ Added to cart."

# 5. Buyer Places Order
echo "[5/7] Buyer placing order..."
# Placing order reduces stock to 9 (12 - 3). This should trigger LOW STOCK ALERT (< 10).
# Also triggers ORDER CONFIRMATION and NEW ORDER ALERT.
RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shippingAddress\": \"123 Test St\"}")
ORDER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
ORDER_NUMBER=$(echo $RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo "Failed to place order. Response: $RESPONSE"
  exit 1
fi
echo "✓ Order placed (ID: $ORDER_ID, No: $ORDER_NUMBER)."
echo ">>> CHECK LOGS/EMAIL FOR: 'Order Confirmation', 'New Order', and 'Low Stock Alert' (Stock is now 9)"

# 6. Seller Updates Order Status
echo "[6/7] Seller updating status to SHIPPED..."
# Should trigger ORDER STATUS UPDATE.
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"SHIPPED\"}" > /dev/null
echo "✓ Status updated."
echo ">>> CHECK LOGS/EMAIL FOR: 'Status Update'"

# 7. Trigger Weekly Summary
echo "[7/7] Triggering Weekly Sales Summary..."
# Should trigger WEEKLY SALES SUMMARY.
curl -s -X POST "$API_URL/email/trigger-weekly-summary" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" > /dev/null
echo "✓ Weekly summary triggered."
echo ">>> CHECK LOGS/EMAIL FOR: 'Weekly Sales Summary'"

echo "=================================================="
echo "   Verification Complete"
echo "=================================================="
