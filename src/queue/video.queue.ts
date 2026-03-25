import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null as any,
};

export const videoQueue = new Queue("video", { connection });

export type TranscodeJobData = { videoId: string };

export async function enqueueTranscode(videoId: string) {
  return videoQueue.add("transcode", { videoId } satisfies TranscodeJobData, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}
