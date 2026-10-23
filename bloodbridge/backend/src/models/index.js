import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const point = { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } };
const organization = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, type: { type: String, enum: ["hospital", "bloodBank"], required: true },
  status: { type: String, enum: ["active", "suspended"], default: "active" }, address: String, location: point,
}, { timestamps: true });
organization.index({ location: "2dsphere" });

const user = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false }, role: { type: String, enum: ["super_admin", "hospital_admin", "blood_bank_admin", "user"], default: "user" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null }, permissions: { type: [String], default: [] }, active: { type: Boolean, default: true },
}, { timestamps: true });
user.pre("save", async function save() { if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12); });
user.methods.checkPassword = function checkPassword(value) { return bcrypt.compare(value, this.password); };

const qr = new mongoose.Schema({ organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, tokenHash: { type: String, unique: true, required: true }, active: { type: Boolean, default: true }, revokedAt: Date }, { timestamps: true });
const assignment = new mongoose.Schema({ hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, active: { type: Boolean, default: true }, assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }, { timestamps: true });

const request = new mongoose.Schema({
  reference: { type: String, unique: true, index: true }, patientName: { type: String, required: true }, contact: { type: String, required: true },
  document: { name: String, type: String, size: Number, data: { type: Buffer, select: false } },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true }, bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
  component: { type: String, enum: ["Whole blood", "Red cells", "Platelets", "Plasma"], required: true }, units: { type: Number, min: 1, max: 50, required: true },
  urgency: { type: String, enum: ["routine", "urgent", "critical"], default: "routine" }, status: { type: String, enum: ["submitted", "under_review", "accepted", "forwarded", "awaiting_sample", "compatibility_confirmed", "ready_for_dispatch", "dispatched", "in_transit", "delivered", "cancelled", "unfulfilled"], default: "submitted", index: true },
  assignedBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" }, notes: { type: String, maxlength: 1000 }, idempotencyKey: { type: String, index: true }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  routingHistory: [{ bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" }, decision: String, reason: String, at: { type: Date, default: Date.now } }],
  trackingTokenHash: { type: String, index: true }, trackingExpiresAt: Date, trackingRevokedAt: Date,
}, { timestamps: true });

const inventory = new mongoose.Schema({ bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true }, bloodGroup: String, component: String, availableUnits: { type: Number, min: 0, default: 0 }, reservedUnits: { type: Number, min: 0, default: 0 }, expiryDate: Date }, { timestamps: true });
inventory.index({ bloodBank: 1, bloodGroup: 1, component: 1, expiryDate: 1 }, { unique: true });
const reservation = new mongoose.Schema({ request: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest", required: true, unique: true }, inventory: { type: mongoose.Schema.Types.ObjectId, ref: "BloodInventory", required: true }, bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, units: { type: Number, min: 1, required: true }, status: { type: String, enum: ["reserved", "allocated", "released"], default: "reserved" }, expiresAt: { type: Date, required: true, index: true }, releasedAt: Date, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }, { timestamps: true });
const vehicle = new mongoose.Schema({ organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, name: { type: String, required: true }, registration: { type: String, required: true, unique: true }, status: { type: String, enum: ["active", "maintenance", "inactive"], default: "active" }, location: point }, { timestamps: true });
const device = new mongoose.Schema({ deviceId: { type: String, required: true, unique: true }, secretHash: { type: String, required: true }, vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true }, status: { type: String, enum: ["active", "revoked"], default: "active" }, lastSeenAt: Date, lastSequence: Number }, { timestamps: true });
const shipment = new mongoose.Schema({ request: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest", required: true, unique: true }, reference: { type: String, unique: true, index: true }, bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }, status: { type: String, enum: ["ready", "dispatched", "in_transit", "delivered", "exception", "cancelled"], default: "ready" }, dispatchedAt: Date, deliveredAt: Date, deliveryNotes: String }, { timestamps: true });
const reading = new mongoose.Schema({ device: { type: mongoose.Schema.Types.ObjectId, ref: "IoTDevice", required: true }, deviceId: { type: String, index: true }, vehicleId: String, shipmentId: { type: String, index: true }, sensorId: String, temperature: Number, deviceTimestamp: Date, receivedAt: { type: Date, default: Date.now }, sequence: Number }, { timestamps: true });
reading.index({ deviceId: 1, sequence: 1 }, { unique: true, sparse: true });
const alert = new mongoose.Schema({ shipmentId: String, temperature: Number, lowerLimit: Number, upperLimit: Number, status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open" }, observedAt: Date, resolvedAt: Date }, { timestamps: true });
const notification = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, title: String, message: String, readAt: Date, request: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest" } }, { timestamps: true });
const complaint = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  request: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest" },
  status: { type: String, enum: ["open", "in_review", "resolved", "closed"], default: "open" },
  resolution: { type: String, maxlength: 2000 },
}, { timestamps: true });

export const User = mongoose.model("User", user);
export const Organization = mongoose.model("Organization", organization);
export const HospitalQRCode = mongoose.model("HospitalQRCode", qr);
export const Assignment = mongoose.model("HospitalBloodBankAssignment", assignment);
export const BloodRequest = mongoose.model("BloodRequest", request);
export const BloodInventory = mongoose.model("BloodInventory", inventory);
export const InventoryReservation = mongoose.model("InventoryReservation", reservation);
export const TemperatureReading = mongoose.model("TemperatureReading", reading);
export const TemperatureAlert = mongoose.model("TemperatureAlert", alert);
export const Vehicle = mongoose.model("Vehicle", vehicle);
export const IoTDevice = mongoose.model("IoTDevice", device);
export const Notification = mongoose.model("Notification", notification);
export const Complaint = mongoose.model("Complaint", complaint);
export const SampleCollection = mongoose.model("SampleCollection", new mongoose.Schema({ request: mongoose.Schema.Types.ObjectId, status: String, collectedAt: Date, collectedBy: mongoose.Schema.Types.ObjectId }, { timestamps: true }));
export const CompatibilityTest = mongoose.model("CompatibilityTest", new mongoose.Schema({ request: mongoose.Schema.Types.ObjectId, outcome: String, notes: String, performedBy: mongoose.Schema.Types.ObjectId }, { timestamps: true }));
export const Shipment = mongoose.model("Shipment", shipment);
export const AuditLog = mongoose.model("AuditLog", new mongoose.Schema({ actor: mongoose.Schema.Types.ObjectId, action: String, entity: String, entityId: mongoose.Schema.Types.ObjectId, metadata: Object }, { timestamps: true }));
export const SystemSetting = mongoose.model("SystemSetting", new mongoose.Schema({ key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed }, { timestamps: true }));
