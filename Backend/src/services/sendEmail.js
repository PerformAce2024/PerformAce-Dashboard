import nodemailer from "nodemailer";

// Load environment variables from the .env file

const sendEmail = async (recipientEmail, message) => {
  try {
    console.log("Setting up the email transporter...");

    // Create a transporter object using SMTP transport (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      service: "Gmail", // You can use any SMTP service (Gmail, Outlook, etc.)
      auth: {
        user: process.env.EMAIL_USER, // Sender's email from environment variables
        pass: process.env.EMAIL_PASS, // Sender's email password from environment variables
      },
    });

    console.log("Transporter setup complete. Preparing email options...");

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email
      to: recipientEmail, // Recipient's email passed as an argument
      subject: "New Message from PerformAce Dashboard", // Subject line
      text: message, // Email body
    };

    console.log(`Sending email to: ${recipientEmail}`);

    // Send the email using the transporter
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.response);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
};

export default sendEmail;
