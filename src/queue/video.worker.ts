import { Worker } from "bullmq";
import dotenv from "dotenv";
import { transcodeToHls } from "../services/ffmpeg.service.js";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null as any,
};

new Worker(
  "video",
  async (job) => {
    console.log("🎬 JOB RECEIVED:", job.id, job.name);

    if (job.name !== "transcode") return;

    const { videoId } = job.data as { videoId: string };

    console.log("🚀 processing video:", videoId);

    await transcodeToHls(videoId);

    console.log("✅ DONE:", videoId);
  },
  { connection, concurrency: 1 },
);

console.log("[worker] running...");
