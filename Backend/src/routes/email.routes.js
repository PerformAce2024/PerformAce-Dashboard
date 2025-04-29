import express from "express";
import contactController from "../controllers/email.controller.js";

const router = express.Router();

// POST route to handle email sending
router.post("/contact-us", contactController);

export default router;
