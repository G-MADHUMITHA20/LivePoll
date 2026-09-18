# LivePoll  
  
A real-time live polling web application that allows users to create polls, share them with an audience, collect votes, and see results update instantly without refreshing the page.  
  
## Overview  
  
LivePoll follows a simple flow:  
  
**Create Poll → Share Link → Audience Votes → Live Results**  
  
The application uses React for the frontend, Go/Gin for the backend, MongoDB for persistent data storage, and Redis Pub/Sub with Server-Sent Events (SSE) for real-time updates.  
  
---  
  
## Key Features  
  
- Secure user signup and login  
- Create and manage custom polls  
- Add multiple voting options dynamically  
- Schedule polls with start and end times  
- Share unique public poll links  
- Single-choice voting  
- Duplicate vote protection  
- Manual poll closing  
- Real-time results without page refresh  
- Dark and Light mode  
- Responsive design for desktop and mobile  
  
---  
  
## How It Works  
  
1. **Create Poll** – Create a poll with a question, multiple options, and optional start/end times.  
2. **Share Link** – Generate and share a unique public poll link.  
3. **Audience Votes** – Participants select one option and submit their vote.  
4. **Live Results** – Votes are stored and distributed in real time to connected users.  
  
---  
  
## Screenshots  
  
### Login / Signup  
  
  ### Dashboard  <img width="1600" height="707" alt="signin signup" src="https://github.com/user-attachments/assets/f1f38c94-68da-49cb-af5f-a8fede0898b4" />

  
---  
  

  


  
---  
  
### Create Poll  
  
 <img width="1600" height="716" alt="poll creation" src="https://github.com/user-attachments/assets/2cf470b8-0692-47ae-ba2f-93c71645c0da" />
  
---  
  
### Manage Poll & Voting Results  
  
<img width="1600" height="729" alt="voting results" src="https://github.com/user-attachments/assets/a413c79a-d0fd-4797-9515-bd2ba39292da" />
 
  
---  
  
### Dashboard 
  
<img width="1600" height="691" alt="dashboard" src="https://github.com/user-attachments/assets/c6672822-d6b7-4f6c-9ada-9ab5e8aba3ce" />
  
  

  
---  
  
## Technology Stack  
  
| Layer | Technology |  
|---|---|  
| Frontend | React, TypeScript, Vite, Tailwind CSS |  
| Backend | Go, Gin |  
| Database | MongoDB |  
| Realtime | Redis Pub/Sub, Server-Sent Events (SSE) |  
| Authentication | JWT, bcrypt |  
  
---  
  
## System Architecture  
  
```text
                ┌─────────────────────┐
                │    React Frontend   │
                └──────────┬──────────┘
                           │
                    REST API + SSE
                           │
                ┌──────────▼──────────┐
                │     Go / Gin API    │
                └───────┬───────┬─────┘
                        │       │
                   MongoDB    Redis
                  Persistence  Pub/Sub
                        │       │
                        └───┬───┘
                            │
                     Live Vote Updates
                            │
                     React Frontend
```

---

## Project Structure

```text
LivePoll/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── utils/
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   └── internal/
│       ├── api/
│       ├── config/
│       ├── models/
│       ├── repository/
│       └── service/
│
└── README.md
```

---

## API

### Authentication

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Poll Management

```text
POST /api/v1/polls
GET  /api/v1/polls
GET  /api/v1/polls/:id
PUT  /api/v1/polls/:id
```

### Public Poll & Voting

```text
GET  /api/v1/public/polls/:id
POST /api/v1/public/polls/:id/vote
```

### Real-Time Updates

```text
GET /api/v1/public/polls/:id/events
```

---

## Local Development

### Prerequisites

- Node.js
- Go
- MongoDB
- Redis

### Backend

```text
cd backend
go mod tidy
go run cmd/server/main.go
```

### Frontend

```text
cd frontend
npm install
npm run dev
```



