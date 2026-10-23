import { Router } from "express";
import crypto from "node:crypto";
import { IoTDevice, Vehicle, Shipment, TemperatureReading, TemperatureAlert, SystemSetting } from "../models/index.js";
import { auth, allow } from "../middleware/auth.js";

const router = Router();
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

router.post("/devices", auth, allow("super_admin", "blood_bank_admin"), async (req, res, next) => { try {
  const vehicle = await Vehicle.findById(req.body.vehicle);
  if (!vehicle || (req.user.role === "blood_bank_admin" && String(vehicle.organization) !== String(req.user.organization))) return res.status(403).json({ success: false, message: "Vehicle is outside your organization" });
  const secret = crypto.randomBytes(32).toString("base64url");
  const device = await IoTDevice.create({ deviceId: req.body.deviceId, secretHash: digest(secret), vehicle: vehicle._id });
  res.status(201).json({ success: true, device: { id: device._id, deviceId: device.deviceId, vehicle: device.vehicle }, secret });
} catch (e) { next(e); } });
router.patch("/devices/:id/revoke", auth, allow("super_admin", "blood_bank_admin"), async (req, res, next) => { try { const device = await IoTDevice.findByIdAndUpdate(req.params.id, { status: "revoked" }, { new: true }); if (!device) return res.status(404).json({ success: false, message: "Device not found" }); res.json({ success: true, device }); } catch (e) { next(e); } });
router.post("/readings", async (req, res, next) => { try {
  const { deviceId, deviceSecret, shipmentId, sensorId, temperature, deviceTimestamp, sequence } = req.body;
  if (!deviceId || !deviceSecret || !shipmentId || !sensorId || typeof temperature !== "number" || !Number.isFinite(temperature) || !deviceTimestamp || !Number.isInteger(sequence)) return res.status(400).json({ success: false, message: "Invalid telemetry payload" });
  const device = await IoTDevice.findOne({ deviceId, secretHash: digest(deviceSecret), status: "active" }).populate("vehicle");
  if (!device) return res.status(401).json({ success: false, message: "Device authentication failed" });
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment || !shipment.vehicle || String(shipment.vehicle) !== String(device.vehicle._id)) return res.status(403).json({ success: false, message: "Device is not assigned to this shipment" });
  if (device.lastSequence !== undefined && sequence <= device.lastSequence) return res.status(409).json({ success: false, message: "Out-of-order or duplicate reading" });
  const timestamp = new Date(deviceTimestamp);
  if (Number.isNaN(timestamp.getTime()) || timestamp.getTime() > Date.now() + 5 * 60 * 1000) return res.status(400).json({ success: false, message: "Invalid device timestamp" });
  const reading = await TemperatureReading.create({ device: device._id, deviceId, vehicleId: device.vehicle._id, shipmentId: shipment.reference, sensorId, temperature, deviceTimestamp: timestamp, sequence });
  await IoTDevice.updateOne({ _id: device._id }, { lastSequence: sequence, lastSeenAt: new Date() });
  let alert = null;
  const setting = await SystemSetting.findOne({ key: `temperature:${shipment._id}` });
  const lower = setting?.value?.lower ?? 2; const upper = setting?.value?.upper ?? 4;
  if (temperature >= lower && temperature <= upper) await TemperatureAlert.updateMany({ shipmentId: shipment.reference, temperature: null, status: { $in: ["open", "acknowledged"] } }, { status: "resolved", resolvedAt: new Date() });
  if (temperature < lower || temperature > upper) {
    const existing = await TemperatureAlert.findOne({ shipmentId: shipment.reference, status: { $in: ["open", "acknowledged"] } });
    if (!existing) alert = await TemperatureAlert.create({ shipmentId: shipment.reference, temperature, lowerLimit: lower, upperLimit: upper, observedAt: timestamp });
  }
  req.app.get("io")?.emit("temperature:reading", { shipmentId: shipment.reference, temperature, receivedAt: reading.receivedAt });
  if (alert) req.app.get("io")?.emit("temperature:alert", { shipmentId: shipment.reference, alertId: alert._id, temperature });
  res.status(201).json({ success: true, reading: { id: reading._id, temperature }, alert: alert ? { id: alert._id, status: alert.status } : null });
} catch (e) { next(e); } });
router.patch("/alerts/:id", auth, allow("super_admin", "blood_bank_admin", "hospital_admin"), async (req, res, next) => { try { if (!["acknowledged", "resolved"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid alert status" }); const alert = await TemperatureAlert.findByIdAndUpdate(req.params.id, { status: req.body.status, resolvedAt: req.body.status === "resolved" ? new Date() : undefined }, { new: true }); if (!alert) return res.status(404).json({ success: false, message: "Alert not found" }); res.json({ success: true, alert }); } catch (e) { next(e); } });
export default router;
