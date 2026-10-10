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

## Setup

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

Create a `.env` file inside the `backend` folder and add the required configuration:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

Replace the example values with your actual configuration. Use the exact environment variable names expected by your backend code.

**Important:** Never commit your `.env` file or expose your database credentials, JWT secret, or API keys.

### 4. Run the Server

```bash
npm run dev
```

The server runs at:

```text
http://localhost:5001
```

The port may vary depending on your backend configuration.

## Authentication

- Passwords are hashed using bcrypt.
- Login returns a signed JWT.
- Protected routes require `Authorization: Bearer <token>`.
- Task operations are restricted to the authenticated user where applicable.

## Core Features

- User Registration and Login
- Create, Update, and Delete Tasks
- Delay Tasks with a Reason and Revised Date
- Task Status Management: Today, Delayed, and Completed
- Overdue Task Detection
- Pagination and Filtering
- REST API Integration
- MongoDB Database Integration
- JWT-Based Authentication
- AI-Powered Task Assistant

## Security

- Passwords are securely hashed.
- JWT authentication protects private routes.
- Environment variables are used for sensitive configuration.
- API keys and database credentials must remain private.