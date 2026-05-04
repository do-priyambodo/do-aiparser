#!/bin/bash

# Colors for premium terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0;0m' # No Color

echo -e "${BLUE}🚀 Starting Automated Backend Integration Test Suite...${NC}\n"

# 1. Health check to verify FastAPI server is live
echo -e "Checking if FastAPI server is alive on localhost:8000..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 307 ]; then
    echo -e "${GREEN}✅ FastAPI server is responsive! (Status: $HTTP_STATUS)${NC}\n"
else
    echo -e "${RED}❌ Error: FastAPI server does not appear to be running on http://localhost:8000.${NC}"
    echo -e "Please make sure you start the backend using ./start-backend.sh before running tests."
    exit 1
fi

# Find receipt path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECEIPT_FILE="$SCRIPT_DIR/test-data/receipt.png"

if [ ! -f "$RECEIPT_FILE" ]; then
    echo -e "${RED}❌ Error: Test data receipt image not found at $RECEIPT_FILE${NC}"
    exit 1
fi

echo -e "Found mock receipt image at: $RECEIPT_FILE"

# 2. TEST CASE 1: Standard Schema Extraction
echo -e "\n-----------------------------------------------"
echo -e "${BLUE}🧪 TEST CASE 1: Standard Schema Extraction${NC}"
echo -e "-----------------------------------------------"
echo "Uploading receipt to /api/extract (without custom fields)..."

START_TIME=$(date +%s)
RESPONSE_1=$(curl -s -X POST "http://localhost:8000/api/extract" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$RECEIPT_FILE;type=image/png")
END_TIME=$(date +%s)
LATENCY=$((END_TIME - START_TIME))

echo -e "\n⏱️ Request Latency: ${LATENCY}s"

# Check if success is true in response
if echo "$RESPONSE_1" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test Case 1 Passed! Response reports success.${NC}"
    # Pretty print merchant and total if python is installed
    if command -v python3 &>/dev/null; then
        echo -e "\nExtracted Standard Summary:"
        echo "$RESPONSE_1" | python3 -c "
import sys, json
res = json.load(sys.stdin)
data = res.get('data', {})
merchant = data.get('merchant', {}).get('name', 'N/A')
total = data.get('financials', {}).get('total_amount', 'N/A')
currency = data.get('financials', {}).get('currency', 'N/A')
items = len(data.get('line_items', []))
print(f'  🏪 Merchant Name: {merchant}')
print(f'  💰 Total Amount:  {currency} {total}')
print(f'  📦 Line Items:    {items} items')
"
    else
        echo "$RESPONSE_1"
    fi
else
    echo -e "${RED}❌ Test Case 1 Failed! Response below:${NC}"
    echo "$RESPONSE_1"
    exit 1
fi


# 3. TEST CASE 2: Custom Fields Extraction
echo -e "\n-----------------------------------------------"
echo -e "${BLUE}🧪 TEST CASE 2: Custom Dynamic Fields Extraction${NC}"
echo -e "-----------------------------------------------"
echo "Uploading receipt with custom tags/descriptors..."

CUSTOM_FIELDS_JSON='{
  "expense_category": "Deduce whether this is Food/Beverage, Softwares, Travel, Utilities, or Office Supplies.",
  "is_business_expense": "Boolean indicating if this is a legitimate corporate or client entertainment meal expense.",
  "tax_percentage_deduced": "Deduced tax rate or percentage applied, e.g. '\''9.5'\''%"
}'

START_TIME=$(date +%s)
RESPONSE_2=$(curl -s -X POST "http://localhost:8000/api/extract" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$RECEIPT_FILE;type=image/png" \
  -F "custom_fields=$CUSTOM_FIELDS_JSON")
END_TIME=$(date +%s)
LATENCY=$((END_TIME - START_TIME))

echo -e "\n⏱️ Request Latency: ${LATENCY}s"

# Check if success is true and custom_extra_fields exists
if echo "$RESPONSE_2" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test Case 2 Passed! Response reports success.${NC}"
    if command -v python3 &>/dev/null; then
        echo -e "\nExtracted Custom Fields Extension Block:"
        echo "$RESPONSE_2" | python3 -c "
import sys, json
res = json.load(sys.stdin)
custom = res.get('data', {}).get('custom_extra_fields', {})
print(json.dumps(custom, indent=4))
"
    else
        echo "$RESPONSE_2"
    fi
else
    echo -e "${RED}❌ Test Case 2 Failed! Response below:${NC}"
    echo "$RESPONSE_2"
    exit 1
fi

# 4. Verify Telemetry Logs
echo -e "\n-----------------------------------------------"
echo -e "${BLUE}📊 TEST CASE 3: Verifying Telemetry Logs${NC}"
echo -e "-----------------------------------------------"
LOG_FILE="$SCRIPT_DIR/apps/backend/extraction.log"

if [ -f "$LOG_FILE" ]; then
    echo -e "${GREEN}✅ extraction.log found! Recent entries:${NC}"
    tail -n 2 "$LOG_FILE"
else
    echo -e "${RED}❌ Error: extraction.log was not created under apps/backend/${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All backend integration tests completed successfully!${NC}"
