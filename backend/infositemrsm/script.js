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

router.post("/infositemrsm", (req, res) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: "No data provided" });
  }

  const payload = req.body;
  writeBackendData(payload);

  res.status(201).json({ success: true, message: "Data saved", data: payload });
});

router.put("/infositemrsm", (req, res) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: "No data provided" });
  }

  const payload = req.body;
  writeBackendData(payload);

  res.json({ success: true, data: payload });
});

export function registerInfositemrsmRoutes(app) {
  app.use("/", router);
  app.use("/api", router);
}

export { readBackendData, writeBackendData, router };
