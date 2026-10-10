// import dotenv from "dotenv";
// dotenv.config();

// import mysql from "mysql2/promise";

// export const db = mysql.createPool({
//   host: process.env.MYSQLHOST,
//   port: process.env.MYSQLPORT,
//   user: process.env.MYSQLUSER,
//   password: process.env.MYSQLPASSWORD,
//   database: process.env.MYSQLDATABASE,

//   ssl: {
//     rejectUnauthorized: false,
//   },

//   waitForConnections: true,
//   connectionLimit: 10,
// });

// export default db;

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Error name:", error.name);
    process.exit(1);
  }
};

export default connectDB;