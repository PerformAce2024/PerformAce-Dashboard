// PerformAce-Dashboard/Backend/src/controllers/admin.controller.js

import {
  createSalesInDB,
  getAllSalesNames,
  getSalesClientsDetails,
  getSalesNameandId,
  getSalesRosDetails,
} from "../services/salesService.js";

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

export const getSalesInfo = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const sales = await getSalesNameandId(email);
    res.status(200).json({ message: "Sales info fetched successfully", sales });
  } catch (error) {
    console.error("Error fetching sales member details: ", error.message);
    res.status(500).json({ message: "Server error while fetching sales" });
  }
};

export const getSalesClients = async (req, res) => {
  try {
    console.log("Fetching clients of sales member");

    const { sales_id } = req.query;

    const clients = await getSalesClientsDetails(sales_id);

    res.status(200).json({ message: "Clients fetched successfully", clients });
  } catch (error) {
    console.error("Error fetching details of the clients", error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching sales member clients" });
  }
};

export const getSalesRos = async (req, res) => {
  try {
    console.log("Fetching ros for the clients");

    const { client_id } = req.query;
    const ros = await getSalesRosDetails(client_id);
    res.status(200).json({ message: "Ros fetched successfully", ros });
  } catch (error) {
    console.error("Error fetching details of ros of the client", error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching ros of clients" });
  }
};
