# FlowTasks – MERN Stack Task Management Application

## Project Description

FlowTasks is a task accountability and management application that helps users organize tasks, track delays, monitor overdue work, and manage task completion.

The application provides a dashboard for task management, user authentication, task assignment, and an AI-powered assistant for answering questions about tasks and users.

This project uses the MERN stack, with React and TypeScript on the frontend, Node.js and Express.js on the backend, and MongoDB for data storage.

## Features

- User registration and login
- Task creation, updating, and deletion
- Task assignment and management
- Delay tasks with a reason and revised date
- Track task statuses: Today, Delayed, and Completed
- Overdue task detection
- Pagination and filtering
- Responsive dashboard
- Admin and user dashboards
- User management
- AI-powered task assistant
- Natural-language questions about tasks, delays, and users

## Technologies Used

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Query

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### AI Integration
- Groq-hosted language model through an OpenAI-compatible API

### Development Tools
- Git and GitHub
- Visual Studio Code

## Project Structure

```text
flowtasks-mern/
├── backend/
│   ├── src/
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone git@github.com:dandu-vamsi-reddy/flowtasks-mern.git
cd flowtasks-mern
```

### 2. Configure the Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and configure the environment variables required by your backend.

Example:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

Replace the example values with your actual local configuration. The variable names must match those used by the backend code.

Start the backend using the appropriate script from `backend/package.json`. For example:

```bash
npm start
```

### 3. Configure the Frontend

Open a second terminal and navigate to the frontend:

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory if required.

Configure the backend API URL using the variable expected by the frontend:

```env
VITE_API_URL=http://localhost:5001/api/
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## AI Assistant

FlowTasks includes an AI assistant that helps users ask natural-language questions about tasks and users.

Example questions include:

- Which tasks assigned to a user are overdue?
- Show me tasks with more than two delays.
- Summarize why a task was delayed.

The assistant uses the backend to process questions and retrieve relevant task information.

## AI Development Tool

**Tool Used:** Code0 (Visual Studio Code Extension)

## AI Development Experience

I used Code0 during development to assist with implementation, debugging, and improving the FlowTasks application. It helped me explore solutions to development issues and work through frontend and backend integration challenges.

I reviewed the suggested changes, tested the implementation, and made adjustments where needed.

### Specific Tasks Where I Used Code0

1. **MongoDB Integration:** Assistance with MongoDB connection setup and troubleshooting database-related issues.
2. **API Development and Debugging:** Assistance with investigating Express.js API errors and request handling.
3. **Frontend Integration:** Assistance with connecting React components to backend API endpoints.
4. **Error Handling:** Assistance with debugging application issues and evaluating possible fixes.
5. **Documentation:** Assistance with organizing project documentation and preparing setup instructions.

## Security

- Do not commit `.env` files.
- Keep database credentials, API keys, and JWT secrets private.
- Store AI API keys on the backend, never in frontend environment variables.
- Configure environment variables separately for local development and deployment.

## Author

Vamsidhar Reddy Dandu