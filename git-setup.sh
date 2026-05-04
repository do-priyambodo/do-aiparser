#!/bin/bash

# Source environment variables if file exists
ENV_FILE=""
if [ -f ".env.local" ]; then
  ENV_FILE=".env.local"
elif [ -f "env.local" ]; then
  ENV_FILE="env.local"
fi

if [ -n "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE..."
  while IFS='=' read -r key value; do
    case "$key" in
      \#* | "") continue ;;
    esac
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    export "$key=$value"
  done < "$ENV_FILE"
fi

# Validate required variables
if [ -z "$YOUR_GITHUB_TOKEN" ] || [ -z "$GITHUB_ORG_NAME" ] || [ -z "$GITHUB_REPO_NAME" ]; then
  echo "🛑 Error: Missing required GitHub configurations!"
  echo "Please execute the following export command(s) manually in your terminal before running this script:"
  echo ""
  if [ -z "$YOUR_GITHUB_TOKEN" ]; then
    echo "  export YOUR_GITHUB_TOKEN=\"ghp_yourPersonalAccessTokenHere\""
  fi
  if [ -z "$GITHUB_ORG_NAME" ]; then
    echo "  export GITHUB_ORG_NAME=\"do-priyambodo\""
  fi
  if [ -z "$GITHUB_REPO_NAME" ]; then
    echo "  export GITHUB_REPO_NAME=\"do-aiparser\""
  fi
  echo ""
  exit 1
fi

ORG_NAME="$GITHUB_ORG_NAME"
REPO_NAME="$GITHUB_REPO_NAME"

echo "Creating repository $ORG_NAME/$REPO_NAME on GitHub..."

# Create repo via API
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: token $YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/orgs/$ORG_NAME/repos \
  -d "{\"name\":\"$REPO_NAME\", \"private\": true}")

if [ "$RESPONSE" -eq 201 ]; then
  echo "Repository created successfully!"
elif [ "$RESPONSE" -eq 422 ]; then
  echo "Repository already exists (or name taken)."
else
  echo "Failed to create repository. HTTP Status: $RESPONSE"
  echo "Please check your token permissions or if the organization exists."
fi

echo "Initializing git and pushing..."

# Check if inside project root (should have 'start-backend.sh' file)
if [ ! -f "start-backend.sh" ]; then
  echo "Error: Not in do-receipts monorepo root directory (missing 'start-backend.sh' file)!"
  exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

# Add remote with token for authentication
git remote remove origin 2>/dev/null
git remote add origin https://$YOUR_GITHUB_TOKEN@github.com/$ORG_NAME/$REPO_NAME.git

git add .
git commit -m "Initial commit for $REPO_NAME"

git push -u origin main

echo "Done!"
