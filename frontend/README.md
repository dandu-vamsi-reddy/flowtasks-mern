# FlowTasks – Frontend

## Overview

FlowTasks is a task management application that helps users organize tasks, track delays, and monitor overdue work.

The frontend provides a responsive dashboard where users can create tasks, update task details, delay tasks with a reason and revised date, and mark tasks as completed. It communicates with the backend REST API for authentication, task management, and AI assistant functionality.

## Tech Stack

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Query

## Features

- User registration and login
- Create, update, and delete tasks
- Delay tasks with a reason and revised date
- Track task status: Today, Delayed, and Completed
- Overdue task detection
- Pagination and filtering
- Responsive dashboard UI
- Task options for updating, delaying, and deleting tasks
- AI-powered task assistant

## Screenshots

### Dashboard

![Dashboard](screenshots/Dashboard.png)

### Create Account

![Create Account](screenshots/Create-account.png)

### Login

![Login](screenshots/Login.png)

### Create Task

![Create Task](screenshots/Create-new-task.png)

### Delay Task

![Delay Task](screenshots/Delay-task.png)

### Update Task

![Update Task](screenshots/Update-task.png)

### Task Options

![Task Options](screenshots/Options.png)

## Prerequisites

- Node.js
- npm
- A running FlowTasks backend API

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/dandu-vamsi-reddy/flowtasks-mern.git
cd flowtasks-mern/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5001/api/
```

For deployment, replace the local URL with your deployed backend API URL.

Make sure the variable name and URL match the frontend API configuration in the source code.

**Security:** Never place AI API keys, database credentials, or other secrets in frontend environment variables prefixed with `VITE_`.

### 4. Start the Development Server

```bash
npm run dev
```

Vite typically starts the frontend at:

```text
http://localhost:5173
```

Use the URL displayed in your terminal if a different port is selected.

## Backend Integration

The frontend communicates with the FlowTasks backend through REST APIs.

The backend provides authentication, task management, and AI assistant functionality.

Repository:

https://github.com/dandu-vamsi-reddy/flowtasks-mern

For backend setup instructions, see the root README and `backend/README.md`.

## AI Task Assistant

The dashboard includes an AI assistant powered by a Groq-hosted language model.

Users can ask natural-language questions about tasks and delays, such as:

- Which tasks are overdue?
- Show me tasks with more than two delays.
- Summarize why a task was delayed.

The assistant sends requests to the backend, which processes supported questions and returns results to the frontend.

The available capabilities depend on the backend implementation.

### AI Configuration

The AI API key must remain on the backend and must never be exposed in frontend code or committed to GitHub.

Configure the following variables in the backend environment if required by your implementation:

```env
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

For local development, configure these values in the backend `.env` file.

For deployment, configure the AI variables in your backend hosting provider and set `VITE_API_URL` to the deployed backend API URL in your frontend hosting environment.

## Author

Vamsidhar Reddy Dandu