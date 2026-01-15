#!/bin/bash

# Quick deployment script for Base Coin Burner Mini App
# Usage: ./deploy.sh [netlify|vercel|github]

set -e

DEPLOY_TARGET=${1:-netlify}

echo "🚀 Deploying Base Coin Burner Mini App to $DEPLOY_TARGET..."

case $DEPLOY_TARGET in
  netlify)
    if ! command -v netlify &> /dev/null; then
      echo "❌ Netlify CLI not found. Install with: npm install -g netlify-cli"
      exit 1
    fi
    echo "📦 Deploying to Netlify..."
    npm install
    npm run build
    netlify deploy --prod --dir=dist
    ;;
    
  vercel)
    if ! command -v vercel &> /dev/null; then
      echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
      exit 1
    fi
    echo "📦 Deploying to Vercel..."
    npm install
    npm run build
    vercel --prod
    ;;
    
  github)
    echo "📦 Preparing for GitHub Pages..."
    echo "⚠️  Make sure you've enabled GitHub Pages in your repository settings"
    echo "⚠️  Push this directory to your GitHub repository"
    echo ""
    echo "To enable GitHub Pages:"
    echo "1. Go to your repository Settings → Pages"
    echo "2. Select source branch (main/master)"
    echo "3. Select root directory or /docs"
    ;;
    
  *)
    echo "❌ Unknown deployment target: $DEPLOY_TARGET"
    echo "Usage: ./deploy.sh [netlify|vercel|github]"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
