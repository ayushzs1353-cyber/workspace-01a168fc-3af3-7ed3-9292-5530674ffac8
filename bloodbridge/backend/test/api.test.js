import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/blood_bridge_test";
process.env.JWT_SECRET = "test-only-secret";
const { default: app } = await import("../src/app.js");
const { default: connectDB } = await import("../src/db/db.js");

await connectDB();
test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("health endpoint exposes service status", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test("protected operations reject anonymous access", async () => {
  const response = await request(app).get("/api/operations/stats");
  assert.equal(response.status, 401);
});

test("device ingestion rejects unauthenticated and incomplete payloads", async () => {
  const response = await request(app).post("/api/iot/readings").send({ deviceId: "unknown" });
  assert.equal(response.status, 400);
});

test("invalid public tracking tokens do not reveal request data", async () => {
  const response = await request(app).get("/api/requests/public/track/not-a-token");
  assert.ok([404, 429].includes(response.status));
  assert.equal(response.body.success, false);
});

test("unknown routes use the consistent API error shape", async () => {
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});
