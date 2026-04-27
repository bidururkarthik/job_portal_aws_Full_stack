// /server/routes/jobs.js
import express from "express";
import Job from "../models/Job.js";
import auth from "../middleware/authMiddleware.js";
import role from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET all jobs (public)
router.get("/", async (req, res) => {
  const jobs = await Job.find().populate("postedBy", "name email");
  res.json(jobs);
});


// ADD THIS ROUTE
router.get("/my", auth, role("employer"), async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user.id });
  res.json(jobs);
});

// GET single job
router.get("/:id", async (req, res) => {
  const job = await Job.findById(req.params.id).populate("postedBy", "name email");
  res.json(job);
});

// POST job (employer)
router.post("/", auth, role("employer"), async (req, res) => {
  const job = await Job.create({
    ...req.body,
    postedBy: req.user.id,
  });
  res.status(201).json(job);
});

// PUT job
router.put("/:id", auth, role("employer"), async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.postedBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Not your job" });

  Object.assign(job, req.body);
  await job.save();

  res.json(job);
});

// DELETE job
router.delete("/:id", auth, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (
    job.postedBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  )
    return res.status(403).json({ message: "Not allowed" });

  await job.deleteOne();
  res.json({ message: "Job deleted" });
});

export default router;