// PerformAce-Dashboard/Backend/src/controllers/admin.controller.js
import { createAdminInDB } from "../services/adminService.js";
import { createSalesInDB, getAllSalesNames } from "../services/salesService.js";

export const createSales = async (req, res) => {
  try {
    const { name, password, email, phone } = req.body;
    console.log("Received request to create a new admin with name:", name);

    // Call the service to create a new admin
    const newSale = await createSalesInDB(name, password, email, phone);

    // If successful, return a 201 status with the new admin data
    res.status(201).json({
      message: "Sales created successfully",
      sales: newSale,
    });
  } catch (error) {
    console.error("Error creating admin:", error.message);

    if (error.message.includes("Sales with this email already exists")) {
      return res.status(400).json({ message: error.message });
    }

    // Handle server errors
    res.status(500).json({ message: "Server error during admin creation" });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const sales = await getAllSalesNames();
    res.status(200).json({
      message: "Sales fetched successfully",
      sales,
    });
  } catch (error) {
    console.error("Error fetching sales:", error.message);
    res.status(500).json({ message: "Server error while fetching sales" });
  }
};
