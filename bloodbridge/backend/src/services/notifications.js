import { Notification } from "../models/index.js";

export async function notifyUsers(req, users, title, message, request = null) {
  const ids = [...new Set(users.filter(Boolean).map((user) => String(user._id || user)))];
  if (!ids.length) return [];
  const records = await Notification.insertMany(ids.map((user) => ({ user, title, message, request })));
  const io = req.app.get("io");
  records.forEach((notification) => io?.to(`user:${notification.user}`).emit("notification:new", notification));
  return records;
}
