import { releaseExpiredReservations } from "../services/reservation.service.js";
import { detectStaleDevices } from "../services/telemetry.service.js";

let running = false;
export function startWorker({ intervalMs = 60_000 } = {}) {
  if (running) return;
  running = true;
  const tick = async () => {
    try { await releaseExpiredReservations(); await detectStaleDevices(); } catch (error) { console.error("Background worker tick failed:", error.message); }
  };
  tick();
  return setInterval(tick, intervalMs);
}
