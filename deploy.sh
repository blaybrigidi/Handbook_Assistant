#!/bin/bash

# Deployment script for Multi-School Handbook Bot

echo "🚀 Starting deployment to Fly.io..."

# Set environment variables for production
echo "📝 Setting environment variables..."

# Snowflake credentials (replace with your actual values)
fly secrets set SNOWFLAKE_USER="YOUR_SNOWFLAKE_USER"
fly secrets set SNOWFLAKE_PASSWORD="YOUR_SNOWFLAKE_PASSWORD"
fly secrets set SNOWFLAKE_ACCOUNT="YOUR_SNOWFLAKE_ACCOUNT"
fly secrets set SNOWFLAKE_WAREHOUSE="COMPUTE_WH"
fly secrets set SNOWFLAKE_DATABASE="SCHOOL_HANDBOOK"
fly secrets set SNOWFLAKE_SCHEMA="PUBLIC"

# Anthropic API key (replace with your actual key)
fly secrets set ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"

echo "✅ Environment variables set!"

# Deploy the application
echo "🔨 Building and deploying..."
fly deploy

echo "🎉 Deployment complete!"
echo "🌐 Your app is available at: https://port-proud-bush-2749.fly.dev" 