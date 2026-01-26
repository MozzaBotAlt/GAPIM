import express from "express";

const router = express.Router();

router.get("/api/date", async (req, res) => {
  try {
    const currentDate = new Date();
    res.json({ date: currentDate });
    console.log(currentDate);
  } catch (error) {
    console.log(`Error:`, error);
  }
  console.log(`Date endpoint accessed from IP: ${req.ip}`);
});

module.exports = router;