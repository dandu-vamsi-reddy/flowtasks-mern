import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.router.js';
import aiRoutes from './routes/ai.router.js';

const app = express();

const redactSensitiveInput = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveInput);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|email|token|secret|authorization|api.?key/i.test(key)
          ? "[REDACTED]"
          : redactSensitiveInput(item),
      ])
    );
  }

  return value;
};

app.use(
  cors({
    origin:  [
    "http://localhost:5173",
    "https://task-tracker-9b99.vercel.app"
  ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log("[HTTP] Incoming request", {
    method: req.method,
    path: req.path,
    params: redactSensitiveInput(req.params),
    query: redactSensitiveInput(req.query),
    body: redactSensitiveInput(req.body),
  });

  res.on("finish", () => {
    console.log("[HTTP] Request completed", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error("[DB] Request rejected because MongoDB is not connected", {
      method: req.method,
      path: req.path,
      readyState: mongoose.connection.readyState,
    });
    return res.status(503).json({ message: "Database is currently unavailable. Please try again shortly." });
  }

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);


export default app;