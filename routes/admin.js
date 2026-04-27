// /server/routes/admin.js
import express from "express";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import auth from "../middleware/authMiddleware.js";
import role from "../middleware/roleMiddleware.js";

const router = express.Router();

// All users
router.get("/users", auth, role("admin"), async (req, res) => {
  res.json(await User.find());
});

// Delete user
router.delete("/users/:id", auth, role("admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// All jobs
router.get("/jobs", auth, role("admin"), async (req, res) => {
  res.json(await Job.find());
});

// Delete job
router.delete("/jobs/:id", auth, role("admin"), async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
});

// Stats
router.get("/stats", auth, role("admin"), async (req, res) => {
  const users = await User.countDocuments();
  const jobs = await Job.countDocuments();
  const applications = await Application.countDocuments();

  res.json({ users, jobs, applications });
});

export default router;