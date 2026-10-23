import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./db/db.js";
import { User, Organization, Assignment, BloodInventory } from "./models/index.js";

dotenv.config();
await connectDB();
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
const adminEmail = (process.env.ADMIN_EMAIL || "admin@bloodbridge.local").toLowerCase();
const passwordHash = await bcrypt.hash(password, 12);
await User.updateOne(
  { email: adminEmail },
  { $set: { name: "Blood Bridge Admin", password: passwordHash, role: "super_admin", active: true, organization: null } },
  { upsert: true, setDefaultsOnInsert: true, runValidators: true },
);
const admin = await User.findOne({ email: adminEmail });
const [hospital, bloodBank] = await Promise.all([
  Organization.findOneAndUpdate({ name: "City General Hospital" }, { name: "City General Hospital", type: "hospital", address: "Synthetic development site", status: "active" }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }),
  Organization.findOneAndUpdate({ name: "Central Blood Bank" }, { name: "Central Blood Bank", type: "bloodBank", address: "Synthetic development site", status: "active" }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }),
]);
await Assignment.findOneAndUpdate({ hospital: hospital._id }, { hospital: hospital._id, bloodBank: bloodBank._id, assignedBy: admin._id, active: true }, { upsert: true });
await BloodInventory.findOneAndUpdate({ bloodBank: bloodBank._id, bloodGroup: "O+", component: "Red cells" }, { bloodBank: bloodBank._id, bloodGroup: "O+", component: "Red cells", availableUnits: 12, expiryDate: new Date(Date.now() + 30 * 86400000) }, { upsert: true });
console.log("Synthetic development records seeded");
process.exit(0);
