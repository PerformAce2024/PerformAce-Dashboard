import express from "express";
import {
  addReleaseOrderToClient,
  createClientAndAddEmailToRO,
  getAllClients,
  getClient,
  getClientROs,
  removeReleaseOrderFromClient,
} from "../controllers/client.controller.js";
import {
  getCampaignIdsByClientEmailAndRO,
  getCampaignMappings,
  getCampaignPerformance,
  submitCampaign,
} from "../controllers/campaign.controller.js";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import { verifyRole } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Route to create client and add email to RO
router.post(
  "/create-client",
  verifyToken,
  verifyRole("admin"),
  createClientAndAddEmailToRO
);

// Route to get all clients
router.get("/get-clients", verifyToken, verifyRole("admin"), getAllClients);

router.get("/clients/:clientId", verifyToken, verifyRole("admin"), getClient);

// // Get all ROs for a specific client
// router.get(
//   "/clients/:clientId/ros",
//   verifyToken,
//   verifyRole("admin"),
//   getClientROs
// );

// // Add a new RO to an existing client
router.post(
  "/clients/:clientId/add-ro",
  verifyToken,
  verifyRole("admin"),
  addReleaseOrderToClient
);

// Remove an RO from a client
router.delete(
  "/clients/:clientId/remove-ro/:roId",
  verifyToken,
  verifyRole("admin"),
  removeReleaseOrderFromClient
);

// Get campaign IDs by client email and RO route
router.get("/get-campaign-ids", (req, res, next) => {
  console.log("GET /get-campaign-ids route hit");
  console.log("Query parameters:", req.query);

  getCampaignIdsByClientEmailAndRO(req, res, next)
    .then(() => console.log("Successfully retrieved campaign IDs"))
    .catch((error) => {
      console.error("Error retrieving campaign IDs:", error);
      next(error);
    });
});

router.get("/campaignMappings", getCampaignMappings);
router.get("/:platform/:campaignId", getCampaignPerformance);

// Simplified submit campaign route
router.post("/submit-campaign", submitCampaign);

export default router;
