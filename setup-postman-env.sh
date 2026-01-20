#!/bin/bash

echo "🔧 Postman API Setup Helper"
echo ""
echo "This script will help you add Postman API credentials to your .env file"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Check if POSTMAN_API_KEY already exists
if grep -q "POSTMAN_API_KEY" .env; then
    echo "⚠️  POSTMAN_API_KEY already exists in .env"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old POSTMAN_API_KEY line (works on both macOS and Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' '/POSTMAN_API_KEY/d' .env
        else
            sed -i '/POSTMAN_API_KEY/d' .env
        fi
    else
        echo "Skipping POSTMAN_API_KEY..."
        SKIP_API_KEY=true
    fi
fi

# Check if POSTMAN_COLLECTION_UID already exists
if grep -q "POSTMAN_COLLECTION_UID" .env; then
    echo "⚠️  POSTMAN_COLLECTION_UID already exists in .env"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old POSTMAN_COLLECTION_UID line
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' '/POSTMAN_COLLECTION_UID/d' .env
        else
            sed -i '/POSTMAN_COLLECTION_UID/d' .env
        fi
    else
        echo "Skipping POSTMAN_COLLECTION_UID..."
        SKIP_UID=true
    fi
fi

# Get API Key
if [ -z "$SKIP_API_KEY" ]; then
    echo ""
    echo "📋 Step 1: Get your Postman API Key"
    echo "   1. Go to: https://postman.com/settings/api-keys"
    echo "   2. Generate or copy your API key"
    echo ""
    read -p "Enter your Postman API Key: " API_KEY
    
    if [ ! -z "$API_KEY" ]; then
        echo "POSTMAN_API_KEY=$API_KEY" >> .env
        echo "✅ POSTMAN_API_KEY added to .env"
    else
        echo "❌ API Key is required. Please run this script again."
        exit 1
    fi
fi

# Get Collection UID
if [ -z "$SKIP_UID" ]; then
    echo ""
    echo "📋 Step 2: Collection UID"
    echo "   Default UID: 4a19928a-dacb-42e1-8086-770fa117dcf0"
    echo "   (You can find it in Postman: Collection → ... → View info)"
    echo ""
    read -p "Enter Collection UID (press Enter for default): " COLLECTION_UID
    
    if [ -z "$COLLECTION_UID" ]; then
        COLLECTION_UID="4a19928a-dacb-42e1-8086-770fa117dcf0"
    fi
    
    echo "POSTMAN_COLLECTION_UID=$COLLECTION_UID" >> .env
    echo "✅ POSTMAN_COLLECTION_UID added to .env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Now you can run:"
echo "   npm run update:postman"
echo ""
echo "This will automatically update your Postman collection from the JSON file."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
