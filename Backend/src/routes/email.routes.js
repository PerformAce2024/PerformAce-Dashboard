import express from 'express';
import sendEmail from '../services/sendEmail.js'; // Import the sendEmail service

const router = express.Router();

// POST route to handle email sending
router.post('/send-email', async (req, res) => {
  console.log('POST /send-email route hit');
  console.log('Request body:', req.body);  // Log the incoming request body
  
  const { recipientEmail, message } = req.body; // Expect recipient email and message in the request body

  // Validate input fields
  if (!recipientEmail || !message) {
    console.error('Missing recipient email or message in the request');
    return res.status(400).json({ error: 'Recipient email and message are required' });
  }

  try {
    console.log(`Sending email to: ${recipientEmail} with message: ${message}`);
    
    // Use the sendEmail service to send the email
    const emailResponse = await sendEmail(recipientEmail, message);

    if (emailResponse.success) {
      console.log('Email sent successfully');
      return res.status(200).json({ message: 'Email sent successfully!' });
    } else {
      console.error('Failed to send email');
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error while sending email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
