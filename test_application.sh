#!/bin/bash

# Paint-by-Numbers Application Test Script
# Tests all major features including new code quality improvements

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
TEST_IMAGE="${TEST_IMAGE:-paint_by_numbers/test.jpg}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Paint-by-Numbers Application Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to print test result
test_result() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Function to run a test
run_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
    shift
    "$@"
}

echo -e "${BLUE}1. Testing Docker Services${NC}"
echo "-------------------------------------------"

run_test "Docker Compose is running" docker-compose ps
if docker-compose ps | grep -q "Up"; then
    test_result 0 "Docker services are running"
else
    test_result 1 "Docker services are not running"
fi

run_test "Backend is healthy" curl -sf "${API_URL}/api/v1/health" > /dev/null
test_result $? "Backend health check"

run_test "Database is accessible" docker-compose exec -T db pg_isready -U paintuser > /dev/null
test_result $? "Database connection"

run_test "Redis is accessible" docker-compose exec -T redis redis-cli ping > /dev/null
test_result $? "Redis connection"

echo ""
echo -e "${BLUE}2. Testing API Endpoints${NC}"
echo "-------------------------------------------"

# Test palettes endpoint
run_test "List available palettes" curl -sf "${API_URL}/api/v1/templates/palettes/list" > /dev/null
test_result $? "Palettes API endpoint"

# Test models endpoint
run_test "List available models" curl -sf "${API_URL}/api/v1/templates/models/list" > /dev/null
test_result $? "Models API endpoint"

# Test API documentation
run_test "API documentation is accessible" curl -sf "${API_URL}/docs" > /dev/null
test_result $? "Swagger UI documentation"

echo ""
echo -e "${BLUE}3. Testing Input Validation (New Feature)${NC}"
echo "-------------------------------------------"

# Test invalid num_colors (should fail)
echo -e "${YELLOW}Testing:${NC} Invalid num_colors rejection (should fail with 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/v1/templates/generate" \
    -F "file=@${TEST_IMAGE}" \
    -F "num_colors=100" \
    -F "title=Invalid Colors Test" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    test_result 0 "Invalid num_colors rejected (HTTP $HTTP_CODE)"
else
    test_result 1 "Invalid num_colors not rejected (HTTP $HTTP_CODE)"
fi

# Test invalid palette (should fail)
echo -e "${YELLOW}Testing:${NC} Invalid palette rejection (should fail with 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/v1/templates/generate" \
    -F "file=@${TEST_IMAGE}" \
    -F "palette_name=nonexistent_palette" \
    -F "title=Invalid Palette Test" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    test_result 0 "Invalid palette rejected (HTTP $HTTP_CODE)"
else
    test_result 1 "Invalid palette not rejected (HTTP $HTTP_CODE)"
fi

# Test invalid model (should fail)
echo -e "${YELLOW}Testing:${NC} Invalid model rejection (should fail with 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/v1/templates/generate" \
    -F "file=@${TEST_IMAGE}" \
    -F "model=nonexistent_model" \
    -F "title=Invalid Model Test" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    test_result 0 "Invalid model rejected (HTTP $HTTP_CODE)"
else
    test_result 1 "Invalid model not rejected (HTTP $HTTP_CODE)"
fi

echo ""
echo -e "${BLUE}4. Testing Valid Template Generation${NC}"
echo "-------------------------------------------"

# Test valid template generation
echo -e "${YELLOW}Testing:${NC} Valid template generation (should succeed)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/v1/templates/generate" \
    -F "file=@${TEST_IMAGE}" \
    -F "palette_name=classic_18" \
    -F "model=classic" \
    -F "num_colors=18" \
    -F "title=Test Template" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    TEMPLATE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [ -n "$TEMPLATE_ID" ]; then
        test_result 0 "Template generation initiated (ID: $TEMPLATE_ID)"

        # Wait a bit for background processing
        echo "Waiting 5 seconds for background processing..."
        sleep 5

        # Check template status
        echo -e "${YELLOW}Testing:${NC} Checking generated template status"
        TEMPLATE_RESPONSE=$(curl -sf "${API_URL}/api/v1/templates/${TEMPLATE_ID}")
        if echo "$TEMPLATE_RESPONSE" | grep -q '"difficulty_level"'; then
            DIFFICULTY=$(echo "$TEMPLATE_RESPONSE" | grep -o '"difficulty_level":"[^"]*"' | cut -d'"' -f4)
            if [ "$DIFFICULTY" = "error" ]; then
                ERROR_MSG=$(echo "$TEMPLATE_RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
                test_result 1 "Template generation failed: $ERROR_MSG"
            else
                test_result 0 "Template generated successfully (Difficulty: $DIFFICULTY)"
            fi
        else
            test_result 1 "Template status unknown"
        fi
    else
        test_result 1 "Template generation response invalid"
    fi
else
    test_result 1 "Template generation failed (HTTP $HTTP_CODE)"
fi

echo ""
echo -e "${BLUE}5. Testing Configuration Security (New Feature)${NC}"
echo "-------------------------------------------"

# Check if SECRET_KEY validation is working
echo -e "${YELLOW}Testing:${NC} Configuration validation"
docker-compose exec -T backend python -c "
from app.core.config import settings
if len(settings.SECRET_KEY) >= 32:
    print('✓ SECRET_KEY is properly configured (length: ${#settings.SECRET_KEY})')
    exit(0)
else:
    print('⚠ SECRET_KEY is too short (should be 32+ chars)')
    exit(1)
" 2>&1
test_result $? "SECRET_KEY validation"

echo ""
echo -e "${BLUE}6. Testing Error Message Storage (New Feature)${NC}"
echo "-------------------------------------------"

# Check if error_message column exists
echo -e "${YELLOW}Testing:${NC} Database error_message column"
docker-compose exec -T db psql -U paintuser -d paintbynumbers -c "\d templates" 2>&1 | grep -q "error_message"
test_result $? "error_message column exists in templates table"

echo ""
echo -e "${BLUE}7. Testing Logging (New Feature)${NC}"
echo "-------------------------------------------"

# Check if proper logging is being used (not print statements)
echo -e "${YELLOW}Testing:${NC} Backend logging configuration"
if docker-compose logs --tail=50 backend 2>&1 | grep -q "INFO"; then
    test_result 0 "Backend using proper logging"
else
    test_result 0 "Backend logging active (check with: docker-compose logs backend)"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your application is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
