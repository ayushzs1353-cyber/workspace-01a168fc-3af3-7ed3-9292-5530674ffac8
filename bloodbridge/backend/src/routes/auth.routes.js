import { Router } from "express";
import jwt from "jsonwebtoken";
import { Organization, User } from "../models/index.js";
import { auth } from "../middleware/auth.js";

const router = Router();
const issue = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
router.post("/login", async (req, res, next) => { try {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password").populate("organization", "name type address status");
  if (!user || !(await user.checkPassword(password || ""))) return res.status(401).json({ success: false, message: "Invalid email or password" });
  res.cookie("bb_access", issue(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000 });
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: user.organization } });
} catch (error) { next(error); } });
router.post("/logout", (req, res) => { res.clearCookie("bb_access"); res.json({ success: true }); });
router.get("/me", auth, async (req, res, next) => { try {
  const organization = req.user.organization ? await Organization.findById(req.user.organization).select("name type address status") : null;
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, organization } });
} catch (error) { next(error); } });
export default router;
