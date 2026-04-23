#!/bin/bash
# register-website.sh - Register a website after generation
# Called by website-builder agent after files are created
#
# Usage: ./register-website.sh <project-name>
#
# This script is safe because:
# - URL, method, headers are hardcoded
# - Only agent can execute it
# - Uses internal API key for auth

set -e

PROJECT="$1"

if [ -z "$PROJECT" ]; then
  echo "Usage: register-website.sh <project-name>"
  exit 1
fi

# Validate project name (alphanumeric, hyphens, underscores only)
if [[ ! "$PROJECT" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: Invalid project name. Use only alphanumeric characters, hyphens, and underscores."
  exit 1
fi

# Internal API endpoint - localhost only
API_URL="http://localhost:3000/internal/websites/${PROJECT}/register"

# Call the internal register endpoint (no userId needed - endpoint finds it)
curl -sf -X POST "$API_URL" \
  -H "X-Internal-Api-Key: ${INTERNAL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "Website registered: ${PROJECT}"
