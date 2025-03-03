// PerformAce-Dashboard/Backend/src/routes/admin.routes.js
import express from "express";
import { createSales, getAllSales } from "../controllers/sales.controller.js";

const router = express.Router();

// API route to create a new admin
router.post("/create-sales", createSales);
router.get("/get-sales", getAllSales);

export default router;
