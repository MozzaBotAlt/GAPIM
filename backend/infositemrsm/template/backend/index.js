import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 8080);
const directory = path.dirname(fileURLToPath(import.meta.url));
const dataFile = process.env.FEED_DATA_FILE || path.join(directory, "feed.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function readFeed() {
  try {
    const contents = await fs.readFile(dataFile, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        slides: [],
        events: [],
        announcements: [],
        settings: {},
      };
    }
    throw error;
  }
}

async function writeFeed(feed) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(feed, null, 2), "utf8");
}

app.get(["/feed", "/api/feed"], async (req, res, next) => {
  try {
    res.json(await readFeed());
  } catch (error) {
    next(error);
  }
});

app.put(["/feed", "/api/feed"], async (req, res, next) => {
  try {
    await writeFeed(req.body);
    res.json(await readFeed());
  } catch (error) {
    next(error);
  }
});

app.post(["/feed", "/api/feed"], async (req, res, next) => {
  try {
    await writeFeed(req.body);
    res.status(201).json(await readFeed());
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "internal_server_error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Template backend listening on port ${port}`);
});
