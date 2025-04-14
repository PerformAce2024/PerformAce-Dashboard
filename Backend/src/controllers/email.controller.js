import contactService from "../services/sendEmail.js";

const contactController = async (req, res) => {
  try {
    const { name, email, company, description } = req.body;

    if (!name || !email || !description) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    await contactService({
      name,
      email,
      company,
      description,
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
};

export default contactController;
