import { Router } from "express";
import { Complaint, User, BloodRequest } from "../models/index.js";
import { auth, allow } from "../middleware/auth.js";
import { notifyUsers } from "../services/notifications.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const filter = req.user.role === "super_admin"
      ? {}
      : { hospital: req.user.organization };
    res.json({ success: true, complaints: await Complaint.find(filter).sort({ createdAt: -1 }).limit(100).populate("request", "reference") });
  } catch (error) { next(error); }
});

router.post("/", allow("hospital_admin"), async (req, res, next) => {
  try {
    const { subject, description, requestId } = req.body;
    if (!subject?.trim() || !description?.trim()) return res.status(400).json({ success: false, message: "Subject and description are required" });
    let request = null;
    if (requestId) {
      request = await BloodRequest.findOne({ _id: requestId, hospital: req.user.organization });
      if (!request) return res.status(400).json({ success: false, message: "Request is not part of this hospital" });
    }
    const complaint = await Complaint.create({ hospital: req.user.organization, createdBy: req.user._id, subject, description, request: request?._id });
    const admins = await User.find({ role: "super_admin", active: true });
    await notifyUsers(req, admins, "New hospital complaint", `${req.user.organization} reported: ${subject}`, request?._id);
    res.status(201).json({ success: true, complaint });
  } catch (error) { next(error); }
});

router.patch("/:complaintId", allow("super_admin"), async (req, res, next) => {
  try {
    const updates = {};
    if (["open", "in_review", "resolved", "closed"].includes(req.body.status)) updates.status = req.body.status;
    if (typeof req.body.resolution === "string") updates.resolution = req.body.resolution.trim();
    const complaint = await Complaint.findByIdAndUpdate(req.params.complaintId, { $set: updates }, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    const hospitalAdmins = await User.find({ organization: complaint.hospital, active: true });
    await notifyUsers(req, hospitalAdmins, "Complaint updated", `Your complaint "${complaint.subject}" is now ${complaint.status}.`, complaint.request);
    res.json({ success: true, complaint });
  } catch (error) { next(error); }
});

export default router;
