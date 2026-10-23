import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { auth, optionalAuth } from "../middleware/auth.js";
import { Assignment, BloodRequest, HospitalQRCode, Organization, BloodInventory, InventoryReservation, User } from "../models/index.js";
import { notifyUsers } from "../services/notifications.js";
import rateLimit from "express-rate-limit";
import multer from "multer";

const router = Router();
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, message: { success: false, message: "Too many public requests. Try again later." } });
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)) });

router.get("/public/qr/:token", publicLimiter, async (req, res, next) => { try {
  const qr = await HospitalQRCode.findOne({ tokenHash: hashToken(req.params.token), active: true }).populate("organization", "name status address");
  if (!qr || qr.organization.status !== "active") return res.status(404).json({ success: false, message: "This hospital QR code is invalid or has been revoked" });
  const assignment = await Assignment.findOne({ hospital: qr.organization._id, active: true }).populate("bloodBank", "name status");
  res.json({ success: true, hospital: qr.organization, assignedBank: assignment?.bloodBank || null });
} catch (e) { next(e); } });

router.post("/", publicLimiter, documentUpload.single("document"), optionalAuth, async (req, res, next) => { try {
  const { patientName, contact, qrToken, bloodGroup, component, urgency, notes, idempotencyKey } = req.body;
  const units = Number(req.body.units);
  if (!patientName || !contact || !bloodGroup || !component || !req.file || !Number.isInteger(units) || units < 1 || units > 50) return res.status(400).json({ success: false, message: "Complete all required request fields and attach a valid document" });
  const qr = qrToken ? await HospitalQRCode.findOne({ tokenHash: hashToken(qrToken), active: true }) : null;
  if (qrToken && !qr) return res.status(400).json({ success: false, message: "This hospital QR code is invalid or has been revoked" });
  const hospital = qr ? qr.organization : await Organization.findOne({ type: "hospital", status: "active" }).sort({ createdAt: 1 });
  if (!hospital) return res.status(503).json({ success: false, message: "No active hospital is available to receive requests yet" });
  if (idempotencyKey) { const existing = await BloodRequest.findOne({ idempotencyKey }); if (existing) return res.json({ success: true, request: { reference: existing.reference, status: existing.status }, duplicate: true }); }
  const assignment = await Assignment.findOne({ hospital: hospital._id, active: true });
  const trackingToken = crypto.randomBytes(32).toString("base64url");
  const request = await BloodRequest.create({ patientName, contact, document: { name: req.file.originalname, type: req.file.mimetype, size: req.file.size, data: req.file.buffer }, hospital: hospital._id, createdBy: req.user?._id, trackingTokenHash: hashToken(trackingToken), trackingExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), bloodGroup, component, units, urgency, notes, idempotencyKey: idempotencyKey || crypto.randomUUID(), reference: `BB-${crypto.randomBytes(5).toString("hex").toUpperCase()}`, assignedBank: assignment?.bloodBank, routingHistory: assignment ? [{ bloodBank: assignment.bloodBank, decision: "sent", reason: "Current hospital assignment" }] : [] });
  if (assignment) await notifyUsers(req, await User.find({ organization: assignment.bloodBank, active: true }), "New blood request", `Request ${request.reference} is awaiting review.`, request._id);
  req.app.get("io")?.emit("request:created", { reference: request.reference, status: request.status });
  res.status(201).json({ success: true, request: { reference: request.reference, status: request.status, hospital: qr.organization, assignedBank: request.assignedBank, trackingToken } });
} catch (e) { next(e); } });

router.get("/public/track/:token", publicLimiter, async (req, res, next) => { try {
  const request = await BloodRequest.findOne({ trackingTokenHash: hashToken(req.params.token), trackingRevokedAt: null, trackingExpiresAt: { $gt: new Date() } }).select("reference status hospital assignedBank createdAt updatedAt").populate("hospital assignedBank", "name");
  if (!request) return res.status(404).json({ success: false, message: "Tracking access is invalid or expired" });
  res.json({ success: true, request });
} catch (e) { next(e); } });

router.get("/", auth, async (req, res, next) => { try {
  const filter = req.user.role === "super_admin" ? {} : req.user.role === "hospital_admin" ? { hospital: req.user.organization } : req.user.role === "blood_bank_admin" ? { assignedBank: req.user.organization } : { createdBy: req.user._id };
  res.json({ success: true, requests: await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(100).populate("hospital assignedBank", "name") });
} catch (e) { next(e); } });

router.post("/:requestId/reserve", auth, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    if (!["super_admin", "blood_bank_admin"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only authorized blood bank staff can reserve inventory" });
    const request = await BloodRequest.findById(req.params.requestId).session(session);
    if (!request || !["submitted", "under_review", "forwarded"].includes(request.status)) return res.status(409).json({ success: false, message: "Request is not available for reservation" });
    if (req.user.role === "blood_bank_admin" && String(request.assignedBank) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Request is outside your blood bank" });
    let result;
    await session.withTransaction(async () => {
      const inventory = await BloodInventory.findOneAndUpdate({ bloodBank: request.assignedBank, bloodGroup: request.bloodGroup, component: request.component, availableUnits: { $gte: request.units }, expiryDate: { $gt: new Date() } }, { $inc: { availableUnits: -request.units, reservedUnits: request.units } }, { new: true, session });
      if (!inventory) throw Object.assign(new Error("Insufficient unexpired inventory"), { status: 409 });
      const reservation = await InventoryReservation.create([{ request: request._id, inventory: inventory._id, bloodBank: request.assignedBank, units: request.units, expiresAt: new Date(Date.now() + 30 * 60 * 1000), createdBy: req.user._id }], { session });
      request.status = "accepted"; await request.save({ session }); result = reservation[0];
    });
    res.status(201).json({ success: true, reservation: result });
  } catch (e) { next(e); } finally { await session.endSession(); }
});

router.post("/:requestId/forward", auth, async (req, res, next) => { try {
  if (!["super_admin", "blood_bank_admin"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only authorized operations staff can forward requests" });
  const request = await BloodRequest.findById(req.params.requestId);
  if (!request || !["submitted", "under_review", "forwarded"].includes(request.status)) return res.status(409).json({ success: false, message: "Request is not available for forwarding" });
  if (req.user.role === "blood_bank_admin" && String(request.assignedBank) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Request is outside your blood bank" });
  const attempted = request.routingHistory.map((entry) => entry.bloodBank);
  const hospital = await Organization.findById(request.hospital).select("location");
  if (!hospital?.location?.coordinates?.length) return res.status(409).json({ success: false, message: "Hospital location is not verified" });
  const candidates = await Organization.find({ _id: { $nin: attempted }, type: "bloodBank", status: "active", location: { $near: { $geometry: hospital.location, $maxDistance: 250000 } } }).limit(50);
  const reason = String(req.body.reason || "Insufficient compatible stock").slice(0, 300);
  if (request.assignedBank) request.routingHistory.push({ bloodBank: request.assignedBank, decision: "declined", reason });
  let nextBank = null;
  for (const bank of candidates) {
    const hasStock = await BloodInventory.exists({ bloodBank: bank._id, bloodGroup: request.bloodGroup, component: request.component, availableUnits: { $gte: request.units }, expiryDate: { $gt: new Date() } });
    if (hasStock) { nextBank = bank; break; }
    request.routingHistory.push({ bloodBank: bank._id, decision: "skipped", reason: "No unexpired compatible stock" });
  }
  if (!nextBank) { request.status = "unfulfilled"; request.assignedBank = undefined; await request.save(); return res.json({ success: true, status: request.status, message: "No eligible participating blood bank has compatible stock" }); }
  request.assignedBank = nextBank._id; request.status = "forwarded"; request.routingHistory.push({ bloodBank: nextBank._id, decision: "forwarded", reason }); await request.save();
  await notifyUsers(req, await User.find({ organization: nextBank._id, active: true }), "Request forwarded", `Request ${request.reference} has been forwarded for review.`, request._id);
  req.app.get("io")?.emit("request:forwarded", { reference: request.reference, assignedBank: nextBank._id });
  res.json({ success: true, status: request.status, assignedBank: nextBank, routingHistory: request.routingHistory });
} catch (e) { next(e); } });

router.patch("/:requestId/status", auth, async (req, res, next) => { try {
  const transitions = { submitted: ["under_review", "cancelled", "unfulfilled"], under_review: ["accepted", "forwarded", "cancelled", "unfulfilled"], accepted: ["awaiting_sample", "cancelled"], awaiting_sample: ["compatibility_confirmed", "cancelled"], compatibility_confirmed: ["ready_for_dispatch"], ready_for_dispatch: ["dispatched"], dispatched: ["in_transit"], in_transit: ["delivered"] };
  const request = await BloodRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  if (req.user.role === "hospital_admin" && String(request.hospital) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Request is outside your hospital" });
  if (req.user.role === "blood_bank_admin" && String(request.assignedBank) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Request is outside your blood bank" });
  if (!["super_admin", "hospital_admin", "blood_bank_admin"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Insufficient permissions" });
  if (!transitions[request.status]?.includes(req.body.status)) return res.status(409).json({ success: false, message: `Cannot move request from ${request.status} to ${req.body.status}` });
  request.status = req.body.status; await request.save();
  req.app.get("io")?.emit("request:status", { reference: request.reference, status: request.status });
  res.json({ success: true, request: { reference: request.reference, status: request.status } });
} catch (e) { next(e); } });

export default router;
