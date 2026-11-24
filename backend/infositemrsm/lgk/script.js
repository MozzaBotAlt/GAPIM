import express from "express";
import { getJsonData, saveJsonData } from "../../database.js";

const router = express.Router();
const documentKey = "infositemrsm";

router.use(express.json());

router.get("/infositemrsm", async (req, res, next) => {
  try {
    const storedDocument = await getJsonData(documentKey);
    if (!storedDocument) {
      return res.status(404).json({ message: "No settings document found" });
    }

    res.json(storedDocument.data);
  } catch (error) {
    next(error);
  }
});

router.post("/infositemrsm", async (req, res, next) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: "No data provided" });
  }

  try {
    const savedDocument = await saveJsonData(documentKey, req.body);
    res.status(201).json({
      success: true,
      message: "Data saved",
      data: savedDocument.data,
      updatedAt: savedDocument.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/infositemrsm", async (req, res, next) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: "No data provided" });
  }

  try {
    const savedDocument = await saveJsonData(documentKey, req.body);
    res.json({
      success: true,
      data: savedDocument.data,
      updatedAt: savedDocument.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

export function registerInfositemrsmRoutes(app) {
  app.use("/", router);
  app.use("/api", router);
}

export { router };
