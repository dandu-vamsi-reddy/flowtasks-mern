# FlowTasks – Backend

## Overview

FlowTasks is a task management and accountability API that allows users to create, update, delay, complete, and manage tasks securely. The backend provides REST APIs for authentication and task management, using JWT-based authentication to protect user data.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt (Password Hashing)

## Features

- User registration and login
- Secure password hashing
- JWT-based authentication
- Create, update, and delete tasks
- Delay tasks with a reason and revised date
- Task status management: Today, Delayed, and Completed
- Overdue task detection
- Pagination and filtering
- MongoDB database integration
- REST API integration
- AI-powered task assistant

## Prerequisites

Before running the backend, make sure you have installed:

- Node.js
- npm
- A MongoDB database
- A Groq API key if you want to use the AI assistant

## Installation and Setup

### 1. Navigate to the Backend Directory

If you cloned the repository, navigate to the backend directory:

```bash
cd backend
```

### 2. Install Dependencies

Run the following command:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory and add your configuration:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

Replace the example values with your actual credentials.

**Important:** Never commit your `.env` file or expose your database credentials, JWT secret, or API keys.

Ensure the environment variable names match those used in your backend code.

### 4. Start the Development Server

Run:

```bash
npm run dev
```

The API will run on the port configured in your environment variables. With the example configuration above, the expected address is:

```text
http://localhost:5001
```

### 5. Connect the Frontend

Start the frontend separately and configure its API URL to match the backend address.

Example frontend environment variable:

```env
VITE_API_URL=http://localhost:5001/api/
```

Make sure this URL matches the API routes configured in your application.

## Authentication

The backend uses JWT-based authentication to protect user-specific resources.

- User passwords are hashed using bcrypt.
- Successful login returns a JSON Web Token (JWT).
- Protected routes require a valid authentication token.
- Authenticated requests use the following authorization header:

```text
Authorization: Bearer <token>
```

- Task operations are restricted according to the application's authentication and authorization logic.

## API Functionality

The backend provides REST API functionality for:

- User registration and login
- Task creation and management
- Task status updates
- Task delays and revised dates
- Task filtering and pagination
- AI assistant requests

The available endpoints depend on the routes implemented in the application.

## AI Assistant

FlowTasks includes an AI-powered task assistant.

The frontend sends requests to the backend, which communicates with the configured language model API to process supported AI requests.

The AI assistant can help users interact with task-related information, depending on the functionality implemented in the application.

## Security

- Passwords are hashed before storage.
- JWT authentication protects private routes.
- Environment variables are used for sensitive configuration.
- Database credentials and API keys should never be committed to GitHub.
- Protected API endpoints should validate authentication and authorization.

## Author

Vamsidhar Reddy Dandu