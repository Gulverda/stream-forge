import path from "node:path";

export const ROOT = process.cwd();

export const uploadsDir = path.join(ROOT, "uploads");

export function videoDir(videoId: string) {
  return path.join(uploadsDir, videoId);
}

export function sourcePath(videoId: string) {
  return path.join(videoDir(videoId), "source.mp4");
}

export function hlsDir(videoId: string) {
  return path.join(videoDir(videoId), "hls");
}

export function masterPlaylistPath(videoId: string) {
  return path.join(hlsDir(videoId), "master.m3u8");
}
