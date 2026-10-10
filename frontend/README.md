# FlowTasks â€“ Frontend

## Overview
FlowTasks is a full-stack task accountability system that helps users manage tasks, track delays, and monitor overdue work.

This frontend application provides a responsive dashboard where users can create tasks, delay tasks with a reason, update them, and mark them as completed.  
The application communicates with a Node.js and MySQL backend API.

---

## Tech Stack

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Query

---

## Features

- User registration and login
- Create, update, and delete tasks
- Delay tasks with reason and new date
- Track task status (Today, Delayed, Completed)
- Overdue task detection
- Pagination and filtering
- Responsive dashboard UI
- Task options menu (update, delay, delete)

---

## Screenshots

### Dashboard
![Dashboard](./screenshots/Dashboard.png)

### Create Account
![Create Account](./screenshots/Create-account.png)

### Login
![Login](./screenshots/Login.png)

### Create Task
![Create Task](./screenshots/Create-new-task.png)

### Delay Task
![Delay Task](./screenshots/Delay-task.png)

### Update Task
![Update Task](./screenshots/Update-task.png)

### Task Options
![Task Options](./screenshots/Options.png)

---

## Installation

Clone the repository
git clone https://github.com/Vamsidhar3081/task-tracker.git

Go to the project folder


cd task-tracker


Install dependencies


npm install


Run the development server


npm run dev


The application will run at


http://localhost:5173


---

## Backend API

This frontend connects to the FlowTasks backend API.

Backend repository:  
https://github.com/Vamsidhar3081/flowtasks-backend

---

## Author

Vamsidhar Reddy Dandu
## AI Task Assistant

The dashboard includes an AI Assistant powered by a Groq-hosted language model. Users can ask natural-language questions about tasks and users, for example:

- Which tasks assigned to Mouser are overdue?
- Show me all tasks with more than 2 delays.
- Summarize why the dashboard task got delayed.

The assistant converts the question into structured task filters, queries the backend, and displays readable task results. It supports task lists, status and overdue questions, delay-count conditions, user statistics, and delay summaries.

### AI Configuration

The AI key is used only by the backend and must never be committed to GitHub or exposed as a `VITE_` frontend variable. Configure these variables in the backend hosting provider:

```env
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

For local development, keep the same values in the backend `.env` file. Configure the deployed backend URL in Vercel as `VITE_API_URL`:

```env
VITE_API_URL=https://your-backend-domain.com/api/
```

