import { Router } from "express";
import { bucket } from "./firebase";

const router = Router();

/**
 * Request a presigned URL for uploading files to Firebase Storage
 * POST /api/uploads/request-url
 * 
 * Request body:
 * {
 *   "name": "filename.jpg",
 *   "size": 1024,
 *   "contentType": "image/jpeg"
 * }
 */
router.post("/request-url", async (req, res) => {
  try {
    const { name, size, contentType } = req.body;

    if (!name || !contentType) {
      return res.status(400).json({ error: "Missing name or contentType" });
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: "File too large (max 50MB)" });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = name.split(".").pop();
    const fileName = `uploads/${timestamp}-${randomStr}.${ext}`;

    const file = bucket.file(fileName);

    // Generate presigned URL (valid for 15 minutes)
    const [presignedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType,
    });

    res.json({
      uploadURL: presignedUrl,
      objectPath: `gs://${bucket.name}/${fileName}`,
      metadata: {
        name,
        size,
        contentType,
      },
    });
  } catch (error: any) {
    console.error("Upload URL request error:", error);
    res.status(500).json({ error: error.message || "Failed to generate upload URL" });
  }
});

/**
 * Get a public URL for accessing uploaded files
 * GET /api/uploads/url?path=gs://bucket/path/to/file
 */
router.get("/url", async (req, res) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== "string") {
      return res.status(400).json({ error: "Missing path parameter" });
    }

    // Parse gs:// path
    const match = path.match(/gs:\/\/([^/]+)\/(.+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid gs:// path" });
    }

    const [, bucketName, filePath] = match;
    const file = bucket.file(filePath);

    // Generate public signed URL (valid for 7 days)
    const [publicUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Get public URL error:", error);
    res.status(500).json({ error: error.message || "Failed to get public URL" });
  }
});

export default router;
