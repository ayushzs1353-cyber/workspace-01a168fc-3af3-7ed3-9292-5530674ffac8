import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.bb_access;
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("+password");
    if (!user || !user.active) return res.status(401).json({ success: false, message: "Session is no longer valid" });
    req.user = user;
    next();
  } catch (error) { return res.status(401).json({ success: false, message: "Invalid or expired session" }); }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.bb_access;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.sub);
    }
  } catch { /* Public request flow remains available when no valid session exists. */ }
  next();
};

export const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: "Insufficient permissions" });
