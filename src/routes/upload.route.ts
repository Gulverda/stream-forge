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
    fs.mkdirSync(videoDir(videoId), { recursive: true });

    const saveTo = sourcePath(videoId);
    const ws = fs.createWriteStream(saveTo);

    file.pipe(ws);

    ws.on("close", async () => {
      const job = await enqueueTranscode(videoId);
      res.json({
        videoId,
        jobId: job.id,
        source: path.basename(saveTo),
        streamUrl: `/videos/${videoId}/hls/master.m3u8`,
      });
    });

    ws.on("error", () => {
      res.status(500).json({ error: "Failed to save file" });
    });
  });

  bb.on("finish", () => {
    if (!handled) res.status(400).json({ error: "No file uploaded" });
  });

  req.pipe(bb);
}
