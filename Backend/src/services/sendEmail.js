// services/contactService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const contactService = async (contactData) => {
  const { name, email, company, description, mobile } = contactData;
  const config = {
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "your-email@example.com",
      pass: process.env.EMAIL_PASSWORD || "your-password",
    },
  };
  console.log(contactData, "ContactData");
  console.log(config, "Confg");

  const transporter = nodemailer.createTransport(config);

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@performacemedia.com",
    to: process.env.EMAIL_TO || "sales@performacemedia.com",
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>PhoneNumber:</strong> ${mobile}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Description:</strong></p>
        <p>${description}</p>
      `,
    text: `
        New Contact Form Submission
        Name: ${name}
        Email: ${email}
        PhoneNumber: ${company}
        Company: ${company || "Not provided"}
        Description: ${description}
      `,
  };

  return transporter.sendMail(mailOptions);
};

export default contactService;
