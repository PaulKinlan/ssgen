#!/bin/bash

# Test script for ssgen service
# This script demonstrates various ways to interact with the service
# Note: Requires a running server with valid GOOGLE_GENERATIVE_AI_API_KEY

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "Testing ssgen service at $BASE_URL"
echo "========================================"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "Command: curl -s $BASE_URL/health"
curl -s "$BASE_URL/health"
echo -e "\n"

# Test 2: Default Content (GET)
echo "Test 2: Default Content Generation (GET)"
echo "Command: curl -s $BASE_URL/"
echo "Response (first 200 chars):"
curl -s "$BASE_URL/" | head -c 200
echo -e "...\n"

# Test 3: Custom Markdown via POST
echo "Test 3: Custom Markdown Content (POST)"
cat << 'EOF' > /tmp/test-payload.json
{
  "content": "# Test Page\n\nThis is a test of the SSG service.\n\n## Features\n- Fast\n- Flexible\n- AI-powered",
  "prompt": "Create a simple HTML page from this markdown",
  "systemPrompt": "You are a helpful web developer assistant."
}
EOF
echo "Command: curl -X POST -H 'Content-Type: application/json' -d @/tmp/test-payload.json $BASE_URL/"
echo "Response (first 200 chars):"
curl -s -X POST -H "Content-Type: application/json" -d @/tmp/test-payload.json "$BASE_URL/" | head -c 200
echo -e "...\n"

# Test 4: Using Example File
echo "Test 4: Using Example Markdown File"
if [ -f "examples/sample-content.md" ]; then
    CONTENT=$(cat examples/sample-content.md | jq -Rs .)
    cat << EOF > /tmp/test-example.json
{
  "content": $CONTENT,
  "prompt": "Create a professional portfolio page from this markdown"
}
EOF
    echo "Command: Using content from examples/sample-content.md"
    echo "Response (first 200 chars):"
    curl -s -X POST -H "Content-Type: application/json" -d @/tmp/test-example.json "$BASE_URL/" | head -c 200
    echo -e "...\n"
else
    echo "Skipping - examples/sample-content.md not found"
    echo ""
fi

# Test 5: Custom Headers (demonstrating context awareness)
echo "Test 5: Custom Headers (Context Awareness)"
cat << 'EOF' > /tmp/test-context.json
{
  "content": "# Welcome",
  "prompt": "Create a welcome page that mentions the visitor's IP address from the request context"
}
EOF
echo "Command: curl -X POST -H 'X-Forwarded-For: 192.168.1.100' -H 'Content-Type: application/json' -d @/tmp/test-context.json $BASE_URL/"
echo "Response (first 200 chars):"
curl -s -X POST -H "X-Forwarded-For: 192.168.1.100" -H "Content-Type: application/json" -d @/tmp/test-context.json "$BASE_URL/" | head -c 200
echo -e "...\n"

# Test 6: 404 Error
echo "Test 6: 404 Error (Invalid Endpoint)"
echo "Command: curl -s $BASE_URL/invalid"
curl -s "$BASE_URL/invalid"
echo -e "\n"

# Cleanup
rm -f /tmp/test-payload.json /tmp/test-example.json /tmp/test-context.json

echo "========================================"
echo "Tests complete!"
echo ""
echo "Note: To see full streaming responses, run individual curl commands without piping to head"
echo "Example: curl -N $BASE_URL/"
