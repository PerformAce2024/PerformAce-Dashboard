import nodemailer from 'nodemailer';  // Correct ES module syntax
import express from 'express';
import pkg from 'body-parser';
const { json } = pkg;


const app = express();
app.use(json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Create a POST endpoint
app.post('/send-email', (req, res) => {
  const { message } = req.body;

  // Set up Nodemailer with Gmail configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'harsh@growthz.ai',  // Your Gmail address
      pass: 'ivjx xkya uzje ljvx',     // Use the App Password here
    },
  });

  // Define the email options
  const mailOptions = {
    from: 'harsh@growthz.ai',
    to: 'srishti@growthz.ai',  // Recipient email
    subject: 'New Message from the Client',
    text: message,  // Message content from the user
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred:', error);  // Log the full error
      return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
    res.status(200).json({ message: 'Email sent successfully!' });
  });
});

// Start the server
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

export default app;
