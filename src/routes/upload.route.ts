import type { Request, Response } from "express";
import Busboy from "busboy";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { enqueueTranscode } from "../queue/video.queue.js";
import { sourcePath, videoDir } from "../services/paths.js";

export function uploadRoute(req: Request, res: Response) {
  const bb = Busboy({ headers: req.headers, limits: { files: 1 } });

  let handled = false;

  bb.on("file", (_field, file, info) => {
    handled = true;

    const mime = info.mimeType;
    if (!mime.startsWith("video/")) {
      file.resume();
      res.status(400).json({ error: "Only video files are allowed" });
      return;
    }

    const videoId = crypto.randomUUID();

    // 1. Catch mkdirSync failures
    try {
      fs.mkdirSync(videoDir(videoId), { recursive: true });
    } catch (err) {
      console.error("Failed to create video directory:", err);
      res.status(500).json({ error: "Failed to create video directory" });
      return;
    }

    const saveTo = sourcePath(videoId);
    const ws = fs.createWriteStream(saveTo);

    file.pipe(ws);

    ws.on("close", async () => {
      // 2. THIS is almost certainly your bug — enqueueTranscode crashing silently
      try {
        const job = await enqueueTranscode(videoId);
        res.json({
          videoId,
          jobId: job.id,
          source: path.basename(saveTo),
          streamUrl: `/videos/${videoId}/hls/master.m3u8`,
        });
      } catch (err) {
        console.error("enqueueTranscode failed:", err); // <-- check your terminal for this
        res
          .status(500)
          .json({ error: "Transcoding queue failed: " + String(err) });
      }
    });

    ws.on("error", (err) => {
      console.error("Write stream error:", err);
      res.status(500).json({ error: "Failed to save file" });
    });
  });

  bb.on("error", (err) => {
    // 3. Busboy errors were also uncaught
    console.error("Busboy error:", err);
    res.status(500).json({ error: "Upload parsing failed" });
  });

  bb.on("finish", () => {
    if (!handled) res.status(400).json({ error: "No file uploaded" });
  });

  req.pipe(bb);
}
