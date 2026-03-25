import express from "express";
import { uploadsDir } from "../services/paths.js";

export const videosRouter = express.Router();

// Serves: /videos/:id/hls/master.m3u8 and segments
videosRouter.use(
  "/",
  express.static(uploadsDir, {
    setHeaders(res) {
      // HLS helpful types (basic)
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);
