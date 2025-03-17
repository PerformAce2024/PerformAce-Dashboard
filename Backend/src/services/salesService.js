// PerformAce-Dashboard/Backend/src/services/adminService.js
import bcrypt from "bcrypt";
import { getDb } from "../config/db.js";

// Service function to create a new admin
export const createSalesInDB = async (name, password, email, phoneNumber) => {
  const db = await getDb();
  try {
    console.log("Connecting to MongoDB to create a new sales...");

    const salesCollection = db.collection("sales");

    // Check if the admin already exists
    const existingSales = await salesCollection.findOne({ name });
    if (existingSales) {
      console.error(`Sales with name ${name} already exists`);
      throw new Error("Sales with this name already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the new admin data
    const newSales = {
      name,
      hashedPassword,
      email,
      phoneNumber,
      createdAt: new Date(),
    };

    // Insert the new admin into the admin collection
    console.log("Inserting new sales into the database...");
    await salesCollection.insertOne(newSales);
    console.log("New Sales created successfully with ID:", newSales._id);

    return newSales;
  } catch (error) {
    console.error("Error creating sales in DB:", error.message);
    throw error;
  }
};

export const getAllSalesNames = async () => {
  try {
    const db = await getDb();
    const salesCollection = db.collection("sales");

    const sales = await salesCollection
      .find({}, { projection: { name: 1 } })
      .toArray();
    return sales.map((sale) => sale.name);
  } catch (error) {
    console.error("Error fetching sales names:", error.message);
    throw error;
  }
};
