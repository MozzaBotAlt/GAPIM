import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, "data.json");

router.use(cors());
router.use(express.json());

function readBackendData() {
  try {
    const raw = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    return { slides: [], announcements: [], settings: {} };
  }
}

function writeBackendData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
}

router.get("/infositemrsm", (req, res) => {
  const data = readBackendData();
  res.json(data);
});

router.put("/infositemrsm", (req, res) => {
  const { slides, announcements } = req.body;
  if (!Array.isArray(slides)) {
    return res.status(400).json({ message: "Invalid slides format" });
  }

  const data = {
    slides: slides.map((slide) => ({
      title: slide.title || "",
      message: slide.message || "",
      imageUrl: slide.imageUrl || "",
      videoUrl: slide.videoUrl || "",
      duration: Number(slide.duration) || 12,
      caption: slide.caption || "",
    })),
    announcements: Array.isArray(announcements) ? announcements : [],
    settings:
      req.body.settings && typeof req.body.settings === "object"
        ? req.body.settings
        : {},
  };

  writeBackendData(data);
  res.json({ success: true, data });
});

export function registerInfositemrsmRoutes(app) {
  app.use("/infositemrsm", router);
  app.use("api/infositemrsm", router);
  app.use("/", router);
}

export { readBackendData, writeBackendData, router };
