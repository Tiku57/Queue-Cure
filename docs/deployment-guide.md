# QueueCure Deployment Guide

This guide outlines the recommended strategies for deploying QueueCure into a production environment.

## 1. Backend Deployment (Node.js/Express)

The backend is a standard Node.js application. We recommend deploying it to a scalable container service or a PaaS like Render, Railway, or AWS Elastic Beanstalk.

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster

### Environment Variables
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/queuecure?retryWrites=true&w=majority
```

### Steps (Docker/Containerized)
1. Build the Docker image from the `backend/` directory:
   ```bash
   docker build -t queuecure-api .
   ```
2. Run the container:
   ```bash
   docker run -p 3001:3001 --env-file .env queuecure-api
   ```

### Socket.IO Considerations
If you deploy multiple instances of the backend (horizontal scaling), you **must** configure a Redis adapter for Socket.IO so events broadcast properly across instances.
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

## 2. Frontend Deployment (Next.js)

The frontend is a Next.js App Router application. The optimal deployment target is Vercel, though any Node server or static host (with SSG constraints) will work.

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Steps (Vercel)
1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your deployed backend.
4. Deploy.

## 3. Database (MongoDB Atlas)

1. Create a free/dedicated cluster on MongoDB Atlas.
2. Go to **Network Access** and add the IP address of your backend server (or `0.0.0.0/0` if necessary).
3. Create a Database User with read/write access.
4. Copy the connection string into the backend's `.env` file.

## 4. Production Monitoring

For production environments, we strongly recommend implementing:
- **PM2**: If running directly on a VM, use PM2 to ensure process restarts on crash.
- **Sentry**: For error tracking in both the React frontend and Node backend.
- **Datadog / New Relic**: To monitor Wait Time Engine computation delays and memory usage.
