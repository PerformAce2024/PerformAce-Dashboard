// PerformAce-Dashboard/Backend/src/routes/admin.routes.js
import express from "express";
import {
  createSales,
  getAllSales,
  getSalesClients,
  getSalesInfo,
  getSalesRos,
} from "../controllers/sales.controller.js";

const router = express.Router();

// API route to create a new admin
router.post("/create-sales", createSales);
router.get("/get-sales", getAllSales);
router.get("/sales-member", getSalesInfo);
router.get("/sales-clients", getSalesClients);
router.get("/sales-ros", getSalesRos);
export default router;
