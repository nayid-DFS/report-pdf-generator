#!/bin/bash

# GANNET SitHub PDF Generator Setup Script

echo "🚀 Setting up GANNET SitHub PDF Generator..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create required directories if they don't exist
echo "📁 Creating required directories..."
mkdir -p output
mkdir -p uploads
mkdir -p src/templates
mkdir -p public

# Copy sample JSON for testing
echo "📋 Setting up sample data..."
cp -n data/sample.json src/Weekly_export.json 2>/dev/null || :

# Add execute permissions to script
chmod +x setup.sh

echo "✅ Setup complete! Run 'npm start' to start the application."
echo "🌐 Then open http://localhost:3000 in your browser." 