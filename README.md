# Collaborative Draw Chat App

## Features
- Real-time collaborative drawing and chat
- Music sync
- Social feed for artwork
- Friendship system
- Opposite-gender instant matching
- Scalable, cloud-native architecture

## Tech Stack
- Next.js (React, SSR)
- Express + Socket.IO (WebSockets)
- MySQL (Google Cloud SQL)
- Google Cloud Storage (GCS)
- JWT Auth, bcryptjs
- Deployed on Google Cloud Run

## Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the root with:
   ```env
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASS=your-db-password
   DB_NAME=your-db-name
   JWT_SECRET=your-jwt-secret
   GCS_BUCKET=your-gcs-bucket
   GCS_PROJECT_ID=your-gcp-project-id
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Or, for production:
   ```bash
   npm run build
   npm start
   ```

## Deployment
- Use Google Cloud Run for deployment.
- Set environment variables in Cloud Run.
- Use Cloud SQL for MySQL and GCS for image storage.

## Database Schema
See the project documentation for SQL table definitions.

## License
MIT
