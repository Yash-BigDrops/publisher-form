#!/bin/bash

# Security Headers Check Script
# Usage: ./scripts/check-headers.sh [URL]

URL=${1:-"http://localhost:3000"}

echo "Checking security headers for: $URL"
echo "=================================="

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed or not in PATH"
    exit 1
fi

# Function to check header
check_header() {
    local header_name=$1
    local expected_value=$2
    local description=$3
    
    echo -n "Checking $header_name... "
    
    local header_value=$(curl -sI "$URL" | grep -i "^$header_name:" | cut -d: -f2- | tr -d '\r\n' | xargs)
    
    if [ -n "$header_value" ]; then
        echo "✓ Found: $header_value"
        if [ -n "$expected_value" ] && [[ "$header_value" == *"$expected_value"* ]]; then
            echo "  ✓ Contains expected value: $expected_value"
        elif [ -n "$expected_value" ]; then
            echo "  ⚠ Missing expected value: $expected_value"
        fi
    else
        echo "✗ Missing"
    fi
    echo
}

# Check security headers
check_header "strict-transport-security" "max-age" "HSTS header"
check_header "x-frame-options" "DENY" "Clickjacking protection"
check_header "x-content-type-options" "nosniff" "MIME sniffing protection"
check_header "referrer-policy" "strict-origin-when-cross-origin" "Referrer policy"
check_header "permissions-policy" "camera=()" "Permissions policy"
check_header "content-security-policy" "" "Content Security Policy"

echo "=================================="
echo "Header check complete!"

# Additional checks
echo
echo "Additional checks:"
echo "=================="

# Check if HTTPS redirect works
if [[ "$URL" == http://* ]]; then
    echo -n "Checking HTTPS redirect... "
    redirect_url=$(curl -sI "$URL" | grep -i "location:" | cut -d: -f2- | tr -d '\r\n' | xargs)
    if [[ "$redirect_url" == https://* ]]; then
        echo "✓ Redirects to HTTPS: $redirect_url"
    else
        echo "✗ No HTTPS redirect found"
    fi
fi

# Check for server information disclosure
echo -n "Checking server header... "
server_header=$(curl -sI "$URL" | grep -i "^server:" | cut -d: -f2- | tr -d '\r\n' | xargs)
if [ -n "$server_header" ]; then
    echo "Found: $server_header"
    if [[ "$server_header" == *"nginx"* ]] || [[ "$server_header" == *"apache"* ]]; then
        echo "  ⚠ Consider hiding server information"
    else
        echo "  ✓ Server information is minimal"
    fi
else
    echo "✓ No server header disclosed"
fi
