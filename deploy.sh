#!/bin/bash

# Collaborative Draw Chat - Google Cloud Run Deployment Script

# Configuration
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="collaborative-draw-chat"
REGION="us-central1"

echo "🚀 Deploying Collaborative Draw Chat to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
echo "🏗️ Building and deploying..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 3600 \
    --set-env-vars "NODE_ENV=production"

echo "✅ Deployment complete!"
echo "🌐 Your app is now running on:"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

echo ""
echo "📝 Next steps:"
echo "1. Set up your database in Cloud SQL"
echo "2. Configure environment variables in Cloud Run"
echo "3. Set up Google Cloud Storage bucket"
echo "4. Update your domain settings" 