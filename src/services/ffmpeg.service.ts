import fs from "node:fs";
import { spawn } from "node:child_process";
import { hlsDir, masterPlaylistPath, sourcePath } from "./paths.js";
import dotenv from "dotenv";

dotenv.config();

export function transcodeToHls(videoId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = sourcePath(videoId);
    const outDir = hlsDir(videoId);
    const outM3u8 = masterPlaylistPath(videoId);
    const ffmpegPath = process.env.FFMPEG_PATH;

    fs.mkdirSync(outDir, { recursive: true });

    // 4s segments, VOD playlist
    const args = [
      "-y",
      "-i",
      input,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-f",
      "hls",
      "-hls_time",
      "4",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      `${outDir}/seg_%03d.ts`,
      outM3u8,
    ];

    const ff = spawn(ffmpegPath!, args, { stdio: ["ignore", "pipe", "pipe"] });

    ff.stderr.on("data", (d) => {
      // FFmpeg logs on stderr; useful for debugging --
      process.stdout.write(d.toString());
    });

    ff.on("error", (err) => reject(err));
    ff.on("close", (code) => {
      console.log("⚙️ ffmpeg exited with code:", code);

      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}
