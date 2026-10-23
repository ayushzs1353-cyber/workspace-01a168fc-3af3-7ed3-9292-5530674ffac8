import { Router } from "express";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { auth, allow } from "../middleware/auth.js";
import { Organization, HospitalQRCode, Assignment, User, AuditLog } from "../models/index.js";
import { audit } from "../middleware/audit.js";
const router = Router();
router.use(auth, allow("super_admin"));
router.get("/", async (req, res, next) => { try { res.json({ success: true, organizations: await Organization.find().sort({ createdAt: -1 }) }); } catch (e) { next(e); } });
router.post("/", async (req, res, next) => { try {
  const organization = await Organization.create({ name: req.body.name, type: req.body.type, address: req.body.address, location: { type: "Point", coordinates: [Number(req.body.longitude) || 0, Number(req.body.latitude) || 0] } });
  let qr = null;
  if (organization.type === "hospital") {
    const token = crypto.randomBytes(32).toString("base64url");
    await HospitalQRCode.create({ organization: organization._id, tokenHash: crypto.createHash("sha256").update(token).digest("hex") });
    qr = { token, dataUrl: await QRCode.toDataURL(`${process.env.CLIENT_URL || "http://localhost:5173"}/request?qr=${token}`) };
  }
  res.status(201).json({ success: true, organization, qr });
} catch (e) { next(e); } });
router.patch("/:organizationId", audit("organization.update", "Organization"), async (req, res, next) => { try {
  const organization = await Organization.findByIdAndUpdate(req.params.organizationId, { $set: { name: req.body.name, address: req.body.address, status: req.body.status } }, { new: true, runValidators: true });
  if (!organization) return res.status(404).json({ success: false, message: "Organization not found" });
  res.json({ success: true, organization });
} catch (e) { next(e); } });
router.post("/:organizationId/admins", audit("user.create", "User"), async (req, res, next) => { try {
  const organization = await Organization.findById(req.params.organizationId);
  if (!organization || organization.status !== "active") return res.status(409).json({ success: false, message: "Organization is not active" });
  const role = organization.type === "hospital" ? "hospital_admin" : "blood_bank_admin";
  const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password, role, organization: organization._id, permissions: req.body.permissions || [] });
  res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: user.organization } });
} catch (e) { next(e); } });
router.get("/:organizationId/admins", async (req, res, next) => { try { res.json({ success: true, users: await User.find({ organization: req.params.organizationId }).select("name email role active permissions createdAt") }); } catch (e) { next(e); } });
router.patch("/:organizationId/admins/:userId", async (req, res, next) => { try { const user = await User.findOneAndUpdate({ _id: req.params.userId, organization: req.params.organizationId }, { $set: { active: req.body.active, permissions: req.body.permissions } }, { new: true }); if (!user) return res.status(404).json({ success: false, message: "Administrator not found" }); await AuditLog.create({ actor: req.user._id, action: "user.update", entity: "User", entityId: user._id, metadata: { active: user.active } }); res.json({ success: true, user }); } catch (e) { next(e); } });
router.post("/:organizationId/qr/rotate", async (req, res, next) => { try {
  const token = crypto.randomBytes(32).toString("base64url");
  await HospitalQRCode.updateMany({ organization: req.params.organizationId, active: true }, { active: false, revokedAt: new Date() });
  await HospitalQRCode.create({ organization: req.params.organizationId, tokenHash: crypto.createHash("sha256").update(token).digest("hex") });
  res.json({ success: true, token, dataUrl: await QRCode.toDataURL(`${process.env.CLIENT_URL || "http://localhost:5173"}/request?qr=${token}`) });
} catch (e) { next(e); } });
router.post("/assignments", async (req, res, next) => { try { const assignment = await Assignment.findOneAndUpdate({ hospital: req.body.hospital, active: true }, { bloodBank: req.body.bloodBank, assignedBy: req.user._id }, { upsert: true, new: true }); res.json({ success: true, assignment }); } catch (e) { next(e); } });
export default router;
