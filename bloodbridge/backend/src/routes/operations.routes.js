import { Router } from "express";
import crypto from "node:crypto";
import { auth, allow } from "../middleware/auth.js";
import { Assignment, BloodInventory, BloodRequest, CompatibilityTest, SampleCollection, Shipment, User, Notification, Vehicle, IoTDevice, TemperatureReading, TemperatureAlert, Organization } from "../models/index.js";
import { notifyUsers } from "../services/notifications.js";

const router = Router();
router.use(auth);
router.get("/stats", async (req, res, next) => { try {
  const scope = req.user.role === "super_admin" ? {} : req.user.role === "hospital_admin" ? { hospital: req.user.organization } : { assignedBank: req.user.organization };
  const [activeRequests, alerts, organizations, inventory] = await Promise.all([
    BloodRequest.countDocuments({ ...scope, status: { $nin: ["delivered", "cancelled", "unfulfilled"] } }),
    TemperatureAlert.countDocuments({ status: "open" }),
    req.user.role === "super_admin" ? Organization.countDocuments({ status: "active" }) : Promise.resolve(1),
    BloodInventory.aggregate([
      { $match: req.user.role === "super_admin" ? {} : { bloodBank: req.user.organization } },
      { $group: { _id: null, units: { $sum: "$availableUnits" } } },
    ]),
  ]);
  res.json({ success: true, stats: { activeRequests, alerts, organizations, availableUnits: inventory[0]?.units || 0 } });
} catch (e) { next(e); } });
router.get("/notifications", async (req, res, next) => { try { const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50); res.json({ success: true, unread: notifications.filter((n) => !n.readAt).length, notifications }); } catch (e) { next(e); } });
router.get("/inventory", async (req, res, next) => { try { const filter = req.user.role === "super_admin" ? {} : { bloodBank: req.user.organization }; res.json({ success: true, inventory: await BloodInventory.find(filter).sort({ expiryDate: 1 }).limit(200) }); } catch (e) { next(e); } });
router.get("/hospital-overview", allow("hospital_admin"), async (req, res, next) => { try {
  const assignment = await Assignment.findOne({ hospital: req.user.organization, active: true }).populate("bloodBank", "name type status address");
  const inventory = assignment?.bloodBank
    ? await BloodInventory.find({ bloodBank: assignment.bloodBank._id, expiryDate: { $gt: new Date() } }).sort({ bloodGroup: 1, component: 1 }).limit(200)
    : [];
  res.json({ success: true, organization: req.user.organization, assignedBank: assignment?.bloodBank || null, inventory });
} catch (e) { next(e); } });
router.get("/alerts", async (req, res, next) => { try {
  if (req.user.role === "super_admin") return res.json({ success: true, alerts: await TemperatureAlert.find({}).sort({ observedAt: -1 }).limit(100) });
  const shipments = await Shipment.find(req.user.role === "blood_bank_admin" ? { bloodBank: req.user.organization } : {}).populate("request", "hospital");
  const allowed = shipments.filter((shipment) => req.user.role === "blood_bank_admin" || String(shipment.request?.hospital) === String(req.user.organization)).map((shipment) => shipment.reference);
  res.json({ success: true, alerts: await TemperatureAlert.find({ shipmentId: { $in: allowed } }).sort({ observedAt: -1 }).limit(100) });
} catch (e) { next(e); } });
router.patch("/notifications/:id/read", async (req, res, next) => { try { const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { readAt: new Date() }, { new: true }); if (!notification) return res.status(404).json({ success: false, message: "Notification not found" }); res.json({ success: true, notification }); } catch (e) { next(e); } });
router.post("/requests/:requestId/sample", allow("super_admin", "hospital_admin", "blood_bank_admin"), async (req, res, next) => { try {
  const request = await BloodRequest.findById(req.params.requestId); if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  if (req.user.role === "hospital_admin" && String(request.hospital) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Outside hospital scope" });
  if (req.user.role === "blood_bank_admin" && String(request.assignedBank) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Outside blood bank scope" });
  const sample = await SampleCollection.findOneAndUpdate({ request: request._id }, { request: request._id, status: "collected", collectedAt: new Date(), collectedBy: req.user._id }, { upsert: true, new: true });
  request.status = "awaiting_sample"; await request.save(); res.json({ success: true, sample });
} catch (e) { next(e); } });
router.post("/requests/:requestId/compatibility", allow("super_admin", "blood_bank_admin"), async (req, res, next) => { try {
  if (!["pending", "in_progress", "confirmed", "failed"].includes(req.body.outcome)) return res.status(400).json({ success: false, message: "Invalid compatibility outcome" });
  const request = await BloodRequest.findById(req.params.requestId); if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  if (req.user.role === "blood_bank_admin" && String(request.assignedBank) !== String(req.user.organization)) return res.status(403).json({ success: false, message: "Outside blood bank scope" });
  const test = await CompatibilityTest.findOneAndUpdate({ request: request._id }, { request: request._id, outcome: req.body.outcome, notes: req.body.notes, performedBy: req.user._id }, { upsert: true, new: true });
  if (req.body.outcome === "confirmed") request.status = "compatibility_confirmed"; if (req.body.outcome === "failed") request.status = "unfulfilled"; await request.save(); res.json({ success: true, test, status: request.status });
} catch (e) { next(e); } });
router.post("/requests/:requestId/shipment", allow("super_admin", "blood_bank_admin"), async (req, res, next) => { try {
  const request = await BloodRequest.findById(req.params.requestId); if (!request || request.status !== "compatibility_confirmed") return res.status(409).json({ success: false, message: "Compatibility must be confirmed before shipment" });
  const shipment = await Shipment.create({ request: request._id, bloodBank: request.assignedBank, vehicle: req.body.vehicle, reference: `SH-${crypto.randomBytes(5).toString("hex").toUpperCase()}` }); request.status = "ready_for_dispatch"; await request.save(); res.status(201).json({ success: true, shipment });
} catch (e) { next(e); } });
router.patch("/shipments/:shipmentId/status", allow("super_admin", "blood_bank_admin", "hospital_admin"), async (req, res, next) => { try {
  const transitions = { ready: ["dispatched", "cancelled"], dispatched: ["in_transit", "exception"], in_transit: ["delivered", "exception"], exception: ["in_transit", "cancelled"] };
  const shipment = await Shipment.findById(req.params.shipmentId).populate("request"); if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
  const shipmentPermitted = req.user.role === "super_admin" || (req.user.role === "blood_bank_admin" && String(shipment.bloodBank) === String(req.user.organization)) || (req.user.role === "hospital_admin" && String(shipment.request?.hospital) === String(req.user.organization));
  if (!shipmentPermitted) return res.status(403).json({ success: false, message: "Shipment is outside your organization" });
  if (!transitions[shipment.status]?.includes(req.body.status)) return res.status(409).json({ success: false, message: "Invalid shipment transition" });
  shipment.status = req.body.status; if (req.body.status === "dispatched") shipment.dispatchedAt = new Date(); if (req.body.status === "delivered") shipment.deliveredAt = new Date(); await shipment.save();
  const requestStatus = { dispatched: "dispatched", in_transit: "in_transit", delivered: "delivered" }[req.body.status]; if (requestStatus) { shipment.request.status = requestStatus; await shipment.request.save(); }
  if (["dispatched", "in_transit"].includes(req.body.status)) {
    const hospitalUsers = await User.find({ organization: shipment.request.hospital, active: true });
    await notifyUsers(req, hospitalUsers, req.body.status === "dispatched" ? "Blood shipment dispatched" : "Blood shipment in transit", `Shipment ${shipment.reference} for ${shipment.request.reference} has ${req.body.status.replace("_", " ")}.`, shipment.request._id);
  }
  res.json({ success: true, shipment });
} catch (e) { next(e); } });
router.get("/telemetry/:shipmentId", async (req, res, next) => { try {
  const shipment = await Shipment.findById(req.params.shipmentId).populate("request", "hospital");
  if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
  const permitted = req.user.role === "super_admin" || (req.user.role === "blood_bank_admin" && String(shipment.bloodBank) === String(req.user.organization)) || (req.user.role === "hospital_admin" && String(shipment.request?.hospital) === String(req.user.organization));
  if (!permitted) return res.status(403).json({ success: false, message: "Shipment is outside your organization" });
  const readings = await TemperatureReading.find({ shipmentId: shipment.reference }).sort({ deviceTimestamp: -1 }).limit(200); const alerts = await TemperatureAlert.find({ shipmentId: shipment.reference }).sort({ observedAt: -1 }); res.json({ success: true, readings, alerts });
} catch (e) { next(e); } });
export default router;
