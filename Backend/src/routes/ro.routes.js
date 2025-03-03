// Backend/src/routes/ro.routes.js
import express from "express";
import {
  createRO,
  getAllROs,
  getROsByClientId,
} from "../controllers/ro.controller.js";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import { verifyRole } from "../middleware/rbacMiddleware.js";
import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Admin routes
router.post("/admin/create-ro", verifyToken, verifyRole("admin"), createRO);
router.get("/admin/get-ros", verifyToken, verifyRole("admin"), getAllROs);
router.get(
  "/client/:clientId/ros",
  verifyToken,
  verifyRole("admin"),
  getROsByClientId
);
// Client routes
router.get("/client/ros/:clientEmail", async (req, res) => {
  let client;
  try {
    client = await connectToMongo();
    const db = client.db("campaignAnalytics");

    const { clientEmail } = req.params;
    console.log("Fetching ROs for client email:", clientEmail);

    // First find the client by email
    const clientDoc = await db
      .collection("clients")
      .findOne({ email: clientEmail });

    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        error: "Client not found with the provided email",
      });
    }

    const clientId = clientDoc._id;
    console.log(`Found client with ID: ${clientId}`);

    // Find RO mappings for this client in ro_client collection
    const roMappings = await db
      .collection("ro_client")
      .find({
        clientId: clientId,
      })
      .toArray();

    if (!roMappings.length) {
      console.log(`No RO mappings found for client ID: ${clientId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    console.log(`Found ${roMappings.length} RO mappings for client`);

    // Extract roIds from mappings
    const roIds = roMappings.map((mapping) => {
      // Handle both ObjectId and string formats
      return typeof mapping.roId === "string"
        ? mapping.roId
        : mapping.roId.toString();
    });

    // Fetch RO details from releaseOrders collection
    const roDetails = await db
      .collection("releaseOrders")
      .find({
        _id: { $in: roIds.map((id) => new ObjectId(id)) },
      })
      .toArray();

    console.log(`Found ${roDetails.length} RO details`);

    // Transform to return an array of objects with id and name
    const formattedROs = roDetails.map((ro) => ({
      id: ro._id.toString(),
      name:
        ro.ro_name || ro.roNumber || `RO #${ro._id.toString().substring(0, 8)}`,
      roNumber: ro.roNumber,
    }));

    res.json({
      success: true,
      data: formattedROs,
    });
  } catch (error) {
    console.error("Error fetching ROs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ROs: " + error.message,
    });
  } finally {
    if (client) await client.close();
  }
});

export default router;
