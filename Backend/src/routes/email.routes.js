// PerformAce-Dashboard/Backend/src/routes/email.routes.js

import express from 'express';
import sendEmail from '../services/sendEmail.js'; // Import the sendEmail service

const router = express.Router();

// POST route to handle email sending
router.post('/send-email', async (req, res) => {
  const { recipientEmail, message } = req.body; // Expect recipient email and message in the request body

  if (!recipientEmail || !message) {
    return res.status(400).json({ error: 'Recipient email and message are required' });
  }

  try {
    // Use the sendEmail service to send the email
    const emailResponse = await sendEmail(recipientEmail, message);

    if (emailResponse.success) {
      return res.status(200).json({ message: 'Email sent successfully!' });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error in email route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
