import { IoTDevice, TemperatureAlert, Shipment } from "../models/index.js";

export async function detectStaleDevices({ now = new Date(), thresholdMs = 15 * 60 * 1000 } = {}) {
  const cutoff = new Date(now.getTime() - thresholdMs);
  const devices = await IoTDevice.find({ status: "active", lastSeenAt: { $lt: cutoff } }).populate("vehicle");
  let created = 0;
  for (const device of devices) {
    const shipments = await Shipment.find({ vehicle: device.vehicle?._id, status: { $in: ["ready", "dispatched", "in_transit"] } });
    for (const shipment of shipments) {
      const existing = await TemperatureAlert.findOne({ shipmentId: shipment.reference, status: { $in: ["open", "acknowledged"] }, temperature: null });
      if (!existing) { await TemperatureAlert.create({ shipmentId: shipment.reference, lowerLimit: 2, upperLimit: 4, observedAt: now, status: "open" }); created += 1; }
    }
  }
  return created;
}
