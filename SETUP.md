# Collaborative Draw Chat - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL database
- Google Cloud account (for deployment)

### 1. Local Development
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
```

### 2. Database Setup
```sql
CREATE DATABASE collaborative_draw_chat;
mysql -u root -p collaborative_draw_chat < database/schema.sql
```

### 3. Environment Variables
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=collaborative_draw_chat
JWT_SECRET=your-secret-key
GCS_BUCKET=your-bucket
GCS_PROJECT_ID=your-project
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Deploy to Google Cloud Run
```bash
chmod +x deploy.sh
./deploy.sh
```

## Features
- Real-time collaborative drawing
- Instant opposite-gender matching
- Live chat during sessions
- Social artwork feed
- Friend system
- Music synchronization

## Architecture
- Frontend: Next.js + React + TypeScript
- Backend: Express + Socket.IO
- Database: MySQL (Cloud SQL)
- Storage: Google Cloud Storage
- Deployment: Google Cloud Run 