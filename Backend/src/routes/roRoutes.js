// Backend/src/routes/ro.routes.js
import express from "express";
import { connectToMongo } from "../config/db.js";

const router = express.Router();

router.get("/ros/:clientEmail", async (req, res) => {
  let client;
  try {
    client = await connectToMongo();
    const db = client.db("campaignAnalytics");

    const { email } = req.params;
    console.log("Fetching ROs for client:", email);

    const roNumbers = await db
      .collection("clientDailyMetricsFinal")
      .distinct("roNumber", { clientEmail });

    console.log("Found ROs:", roNumbers);

    res.json({
      success: true,
      data: roNumbers,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ROs",
    });
  } finally {
    if (client) await client.close();
  }
});

export default router;
