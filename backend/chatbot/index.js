import express from "express";
import { getChatHistory, saveChatMessage } from "../database.js";

const router = express.Router();

function buildResponse(message) {
  const normalized = (message || "").toString().trim().toLowerCase();

  if (!normalized) {
    return "How can I help you today?";
  }

  if (normalized.includes("hello") || normalized.includes("hi")) {
    return "Hello! I’m your backend chatbot. Tell me what you need.";
  }

  if (normalized.includes("status")) {
    return "The server is up and the chatbot integration is active.";
  }

  if (normalized.includes("help")) {
    return "You can send a message and I’ll store it alongside your request history.";
  }

  return `I received: "${message}". Your message has been logged for review.`;
}

router.get("/history", async (req, res) => {
  try {
    const history = await getChatHistory(20);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/message", async (req, res) => {
  try {
    const { message, userId, metadata } = req.body || {};
    const responseText = buildResponse(message);

    const saved = await saveChatMessage({
      message,
      userId,
      metadata,
      response: responseText,
      source: "http",
    });

    res.json({ success: true, reply: responseText, saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/message", async (req, res) => {
  try {
    const { message, userId, metadata } = req.body || {};
    const responseText = buildResponse(message);

    const saved = await saveChatMessage({
      message,
      userId,
      metadata,
      response: responseText,
      source: "http-put",
    });

    res.json({ success: true, reply: responseText, saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
