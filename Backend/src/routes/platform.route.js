import express from "express";
import PlatformDataRepo from "../repo/platformDataRepo.js";

const router = express.Router();
router.get("/platformData", async (req, res) => {
  try {
    const platform = req.query.platform;
    if (!platform) {
      return res.status(400).send("Platform parameter is required");
    }

    console.log(`Fetching data for platform: ${platform}`);
    const platformData = await PlatformDataRepo.getPlatformData(platform);
    res.json(platformData);
  } catch (error) {
    console.error(`Error fetching platform data: ${error}`);
    res.status(500).send("An error occurred while fetching platform data");
  }
});

router.get("/filteredData", async (req, res) => {
  try {
    const { clientName, platform } = req.query;
    if (!clientName || !platform) {
      return res
        .status(400)
        .send("Both clientName and platform parameters are required");
    }

    console.log(
      `Fetching filtered data for client: ${clientName}, platform: ${platform}`
    );
    const filteredData = await PlatformDataRepo.getFilteredData(
      clientName,
      platform
    );
    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    res.status(500).send("An error occurred while fetching filtered data");
  }
});

export default router;
