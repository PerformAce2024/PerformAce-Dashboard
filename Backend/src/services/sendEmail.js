// PerformAce-Dashboard/Backend/src/services/sendEmail.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

const sendEmail = async (recipientEmail, message) => {
  try {
    // Create a transporter object using SMTP transport (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // You can use any SMTP service (Gmail, Outlook, etc.)
      auth: {
        user: process.env.EMAIL_USER, // Sender's email from environment variables
        pass: process.env.EMAIL_PASS  // Sender's email password from environment variables
      }
    });

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER,      // Sender's email
      to: 'srishti@growthz.ai',                // Recipient's email passed as an argument
      subject: 'New Message from PerformAce Dashboard', // Subject line
      text: message                      // Email body
    };

    // Send the email using the transporter
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.response);
    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
};

export default sendEmail;
