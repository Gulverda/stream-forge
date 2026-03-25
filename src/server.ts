import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { uploadRoute } from "./routes/upload.route";
import { videosRouter } from "./routes/video.route";

dotenv.config();

const app = express();

app.use(cors());

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// upload
app.post("/upload", uploadRoute);

// serve videos
app.use("/videos", videosRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`✅ API running: http://localhost:${port}`);
});
