import express from "express";
import { getDspOutbrainCampaignPerformanceResult } from "../services/dspoutbrainService.js";

const router = express.Router();

router.get("/campaign-performance", async (req, res, next) => {
  console.log("GET /campaign-performance route hit");
  try {
    const { campaignId, from, to } = req.query;

    if (!campaignId || !from || !to) {
      return res.status(400).json({
        error:
          "Missing required parameters: campaignId, from, and to dates are required",
      });
    }

    const data = await getDspOutbrainCampaignPerformanceResult(
      campaignId,
      from,
      to
    );
    res.json(data);
    console.log("Campaign performance fetched successfully");
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    next(error);
  }
});

export default router;
