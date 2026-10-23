import dotenv from "dotenv";
import http from "node:http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { startWorker } from "./src/jobs/worker.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true },
});

app.set("io", io);
io.on("connection", (socket) => {
  const token = socket.handshake.headers.cookie ? cookie.parse(socket.handshake.headers.cookie).bb_access : null;
  try {
    const user = jwt.verify(token || "", process.env.JWT_SECRET);
    socket.join(`user:${user.sub}`);
  } catch { socket.disconnect(true); }
});

await connectDB();
startWorker();
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});