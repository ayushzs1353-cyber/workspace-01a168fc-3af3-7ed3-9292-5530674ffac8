import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import requestRoutes from "./routes/request.routes.js";
import iotRoutes from "./routes/iot.routes.js";
import operationsRoutes from "./routes/operations.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "blood-bridge-api", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/operations", operationsRoutes);
app.use("/api/complaints", complaintRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

export default app;
