# FlowTasks – Frontend

## Overview

FlowTasks is a task management application that helps users organize tasks, track delays, monitor overdue work, and manage task completion through a responsive dashboard.

The frontend communicates with the backend REST API to provide authentication, task management, and AI assistant functionality.

## Technologies Used

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Query

## Features

- User registration and login
- Responsive dashboard
- Create, update, and delete tasks
- Task assignment and management
- Delay tasks with a reason and revised date
- Track Today, Delayed, and Completed tasks
- Overdue task detection
- Pagination and filtering
- Admin and user dashboards
- User management
- AI-powered task assistant

## Prerequisites

- Node.js
- npm

## Installation and Setup

### 1. Navigate to the Frontend

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the API URL

Create a `.env` file in the frontend directory if required by your configuration.

Example:

```env
VITE_API_URL=http://localhost:5001/api/
```

Make sure the variable name and URL match your frontend API configuration.

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal. Vite commonly uses:

```text
http://localhost:5173
```

## AI Assistant

The frontend includes an AI assistant interface that allows users to ask questions about tasks and delays. Requests are processed through the backend API.

## Author

Vamsidhar Reddy Dandu