import mongoose from "mongoose";
import { AuditLog, BloodInventory, BloodRequest, InventoryReservation } from "../models/index.js";

export async function releaseExpiredReservations({ now = new Date() } = {}) {
  const reservations = await InventoryReservation.find({ status: "reserved", expiresAt: { $lte: now } }).limit(100);
  let released = 0;
  for (const reservation of reservations) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const locked = await InventoryReservation.findOneAndUpdate({ _id: reservation._id, status: "reserved" }, { status: "released", releasedAt: now }, { new: true, session });
        if (!locked) return;
        await BloodInventory.updateOne({ _id: locked.inventory }, { $inc: { availableUnits: locked.units, reservedUnits: -locked.units } }, { session });
        await BloodRequest.updateOne({ _id: locked.request, status: "accepted" }, { status: "unfulfilled" }, { session });
        await AuditLog.create([{ action: "inventory.reservation_released", entity: "InventoryReservation", entityId: locked._id, metadata: { reason: "expired", units: locked.units } }], { session });
        released += 1;
      });
    } finally { await session.endSession(); }
  }
  return released;
}
