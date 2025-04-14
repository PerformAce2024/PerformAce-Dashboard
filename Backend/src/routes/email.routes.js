import express from "express";
import sendEmail from "../services/sendEmail.js"; // Import the sendEmail service
import contactController from "../controllers/email.controller.js";

const router = express.Router();

// POST route to handle email sending
router.post("/contact-us", contactController);

export default router;
