# Live Polling Tool

## Short Description
A production-quality live polling tool that allows users to create polls, share links, let audiences vote, and view results in real-time.

## Problem Statement
The goal is to build an interactive live polling application with a modern SaaS-style frontend and a scalable Go-based backend.
Required Flow: Create Poll → Share Link → Audience Votes → Live Results

## Required Technology Stack
- **Frontend**: React (Vite, Tailwind CSS, React Router)
- **Backend**: Go with Gin
- **Database**: MongoDB 
- **Realtime**: Redis

## Current Project Structure
```
/frontend
  - React application with Vite, Tailwind CSS, and React Router.
  - Contains foundational UI and page placeholders.

/backend
  - Go application with Gin.
  - Contains clean architecture scaffolding, config management, and a health endpoint.
```

## Local Setup Instructions

### Environment Variables
1. Navigate to `/backend`.
2. Copy `.env.example` to `.env`.
3. Fill in the required values (MongoDB and Redis are not required for Stage 1).

### How to run frontend
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The frontend will typically run at `http://localhost:5173`.

### How to run backend
1. Ensure you have Go installed on your machine.
2. Navigate to the `backend` directory: `cd backend`
3. Start the server: `go run cmd/server/main.go`
4. The backend will typically run at `http://localhost:8080`.
5. You can test the API health check at `http://localhost:8080/api/v1/health`.


