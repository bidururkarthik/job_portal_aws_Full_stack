// /server/routes/applications.js
import express from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import auth from "../middleware/authMiddleware.js";
import role from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../config/s3.js";

const router = express.Router();

// APPLY for job (upload resume)
router.post(
  "/",
  auth,
  role("seeker"),
  upload.single("resume"),
  async (req, res) => {
    const { jobId } = req.body;

    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
      resumeUrl: req.file.key, // S3 key
    });

    res.status(201).json(application);
  }
);

// GET my applications
router.get("/mine", auth, role("seeker"), async (req, res) => {
  const apps = await Application.find({ applicant: req.user.id })
    .populate("job");

  res.json(apps);
});

// GET applicants for job (employer)
router.get("/job/:id", auth, role("employer"), async (req, res) => {
  const apps = await Application.find({ job: req.params.id })
    .populate("applicant", "name email");

  // Generate signed URLs
  const result = await Promise.all(
    apps.map(async (app) => {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: app.resumeUrl,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return {
        ...app.toObject(),
        resumeDownloadUrl: url,
      };
    })
  );

  res.json(result);
});

// UPDATE status
router.put("/:id", auth, role("employer"), async (req, res) => {
  const app = await Application.findById(req.params.id);
  app.status = req.body.status;
  await app.save();

  res.json(app);
});

export default router;