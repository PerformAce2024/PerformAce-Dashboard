import express from "express";
import { getCPCByRoId } from "../controllers/releaseOrders.controller.js";

const router = express.Router();

router.get("/cpc/:roId", async (req, res) => {
  console.log("GET /cpc/:roId route hit");
  await getCPCByRoId(req, res);
});

export default router;
