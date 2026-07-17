import express from "express";
import fs from "node:fs";
import path from "node:path";
import { uploadsDir } from "../services/paths.js";

export const videosRouter = express.Router();

/**
 * GET /videos/list
 * აბრუნებს ყველა ატვირთული ვიდეოს სიას
 */
videosRouter.get("/list", (req, res) => {
  try {
    // ვამოწმებთ არსებობს თუ არა საერთოდ uploads დირექტორია
    if (!fs.existsSync(uploadsDir)) {
      return res.json([]);
    }

    // ვკითხულობთ ყველა საქაღალდეს (თითო საქაღალდე = თითო ვიდეო ID)
    const folders = fs.readdirSync(uploadsDir);

    const videoList = folders
      .map((videoId) => {
        // ვამოწმებთ, არის თუ არა ეს ნამდვილად დირექტორია
        const fullPath = path.join(uploadsDir, videoId);
        if (!fs.statSync(fullPath).isDirectory()) return null;

        return {
          id: videoId,
          title: `Video ${videoId.substring(0, 8)}`, // დროებითი სახელი ID-ს მიხედვით
          streamUrl: `/videos/${videoId}/hls/master.m3u8`,
          createdAt: fs.statSync(fullPath).birthtime,
        };
      })
      .filter(Boolean); // ვფილტრავთ null მნიშვნელობებს

    res.json(videoList);
  } catch (error) {
    console.error("Error listing videos:", error);
    res.status(500).json({ error: "Failed to fetch video list" });
  }
});

/**
 * სტატიკური ფაილების მიწოდება (HLS)
 * Serves: /videos/:id/hls/master.m3u8
 */
videosRouter.use(
  "/",
  express.static(uploadsDir, {
    setHeaders(res) {
      // CORS-ის დაშვება HLS ფლეიერისთვის
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    },
  }),
);
