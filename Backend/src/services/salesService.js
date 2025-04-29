// PerformAce-Dashboard/Backend/src/services/adminService.js
import bcrypt from "bcrypt";
import { getDb } from "../config/db.js";
import { ObjectId } from "mongodb";

// Service function to create a new admin
export const createSalesInDB = async (name, password, email, phoneNumber) => {
  const db = await getDb();
  try {
    console.log("Connecting to MongoDB to create a new sales...");

    const salesCollection = db.collection("sales");

    // Check if the sales already exists
    const existingSales = await salesCollection.findOne({ email });
    if (existingSales) {
      console.error(`Sales with name ${name} already exists`);
      throw new Error("Sales with this name already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the new sales data
    const newSales = {
      name,
      hashedPassword,
      email,
      phoneNumber,
      createdAt: new Date(),
      role: "Sales",
      releaseOrders: [],
    };

    // Insert the new sales into the sales collection
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
    return sales.map((sale) => ({ name: sale.name, sales_id: sale._id }));
  } catch (error) {
    console.error("Error fetching sales names:", error.message);
    throw error;
  }
};

export const getSalesNameandId = async (email) => {
  try {
    const db = await getDb();
    console.log("Connecting to MongoDB to get sales member info");
    const salesCollection = db.collection("sales");
    const salesMember = await salesCollection.findOne(
      {
        email: email,
      },
      {
        projection: { _id: 1, name: 1 },
      }
    );
    if (!salesMember) {
      console.warn("No sales member found with the provided email");
      return null;
    }

    return salesMember;
  } catch (error) {
    console.error("Error fetching sales member details", error);
    return null;
  }
};

export const getSalesClientsDetails = async (sales_id) => {
  try {
    const db = await getDb();
    console.log("Connecting to MongoDB to get clients of sales member info");
    const clientCollection = db.collection("clients");
    const clients = await clientCollection
      .find({
        releaseOrders: {
          $elemMatch: {
            soldBy: sales_id,
          },
        },
      })
      .project({ name: 1, email: 1 }) // include _id by default
      .toArray();

    return clients;
  } catch (error) {
    console.error("Error in fetching clients by sales_id:", error);
    return [];
  }
};
// Have to change this logic
export const getSalesRosDetails = async (client_id) => {
  try {
    const db = await getDb();
    const client = await db
      .collection("clients")
      .findOne({ _id: new ObjectId(client_id) });

    if (!client || !client.releaseOrders) {
      return [];
    }

    const ros = client.releaseOrders.map((order) => ({
      roId: order.roId,
      roName: order.roName,
    }));
    console.log(ros, "These are roIds");

    return ros;
  } catch (error) {
    console.error("Error in fetching ros by client_id:", error);
    return [];
  }
};
