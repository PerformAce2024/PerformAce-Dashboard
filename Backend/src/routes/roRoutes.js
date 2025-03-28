// Backend/src/routes/ro.routes.js
import express from "express";

const router = express.Router();

router.get("/ros/:clientEmail", async (req, res) => {
  let client;
  try {
    client = req.app.locals.db;

    const { email } = req.params;
    console.log("Fetching ROs for client:", email);

    const roNumbers = await client
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
  }
});

export default router;
