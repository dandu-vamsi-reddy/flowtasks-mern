# FlowTasks – Backend

## Overview

FlowTasks is a task management and accountability API that allows users to create, update, delay, complete, and manage tasks securely.

The backend provides REST APIs for authentication and task management. JWT-based authentication protects user data, while MongoDB stores application data.

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
- AI-powered task assistant

## Prerequisites

- Node.js
- npm
- MongoDB database
- Groq API key for AI assistant functionality

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/dandu-vamsi-reddy/flowtasks-mern.git
cd flowtasks-mern/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

Replace the example values with your actual configuration.

**Important:** Never commit your `.env` file or expose your database credentials, JWT secret, or API keys.

Ensure these variable names match the configuration expected by your backend code.

### 4. Run the Development Server

```bash
npm run dev
```

The server runs on the port configured in your `.env` file. With the example configuration above, the expected address is:

```text
http://localhost:5001
```

## Authentication

- User passwords are hashed using bcrypt.
- Successful login returns a signed JWT.
- Protected routes require a valid authentication token.
- Authenticated requests use the following header:

```text
Authorization: Bearer <token>
```

- Access to tasks is controlled by the backend's authentication and authorization logic.

## API Functionality

The backend provides endpoints for user authentication and task management.

Available functionality includes:

- User registration and login
- Task creation and management
- Task status updates
- Task delays and revised dates
- Task filtering and pagination
- AI assistant requests

The available endpoints depend on the routes implemented in the application.

## AI Assistant

FlowTasks includes an AI assistant that communicates with a language model through the backend.

The backend processes supported requests using the configured AI API and returns responses to the frontend.

## Security

- Passwords are hashed before storage.
- JWT authentication protects private routes.
- Environment variables store sensitive configuration.
- Database credentials and API keys should never be committed to GitHub.

## Author

Vamsidhar Reddy Dandu