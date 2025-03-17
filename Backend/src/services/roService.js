import { getDb } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new RO in the database
export const createROInDB = async (roData) => {
  console.log("Connecting to MongoDB to create a new RO...");
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const roCollection = clientDb.collection("releaseOrders");

  const newRO = {
    ...roData,
    createdAt: new Date(),
  };

  console.log("Inserting new RO into the database:", newRO);

  // Insert the new Release Order into the DB
  const result = await roCollection.insertOne(newRO);
  console.log("RO inserted successfully with ID:", result.insertedId);

  return { insertedId: result.insertedId };
};

// Update RO by adding the client's email
export const updateROWithClientEmail = async (roId, clientEmail) => {
  console.log(`Connecting to MongoDB to update RO with ID: ${roId}`);
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const roCollection = clientDb.collection("releaseOrders");

  console.log(
    `Updating RO with client email: ${clientEmail} for RO ID: ${roId}`
  );

  // Use $addToSet to ensure uniqueness in the array
  const result = await roCollection.updateOne(
    { _id: new ObjectId(roId) },
    {
      $addToSet: { clientEmail: clientEmail }, // Add the email to the array if it doesn't exist
    }
  );

  if (result.matchedCount === 0) {
    console.error(`No RO found with ID: ${roId}`);
    throw new Error(`No RO found with ID: ${roId}`);
  }

  console.log("RO updated successfully:", result);
  return result;
};

// Function to get all ROs from the database
export const getAllROsFromDB = async () => {
  console.log("Connecting to MongoDB to fetch all ROs...");
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const roCollection = clientDb.collection("releaseOrders");

  console.log("Fetching all Release Orders from the database...");
  // Fetch all Release Orders
  const ros = await roCollection.find({}).toArray();
  console.log("ROs fetched successfully:", ros);

  return ros;
};

export const getROsForClientFromDB = async (clientId) => {
  console.log(`Connecting to MongoDB to fetch ROs for client: ${clientId}...`);
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const roClientCollection = clientDb.collection("ro_client");
  const roCollection = clientDb.collection("releaseOrders");

  console.log(`Fetching RO mappings for client ID: ${clientId}...`);
  // First, get all the RO IDs associated with this client
  const roMappings = await roClientCollection
    .find({
      clientId: ObjectId.createFromHexString(clientId),
    })
    .toArray();

  console.log(`Found ${roMappings.length} RO mappings for client`);

  if (roMappings.length === 0) {
    return [];
  }

  // Extract all RO IDs for this client
  const roIds = roMappings.map((mapping) => mapping.roId);

  // Now fetch the actual RO details from the releaseOrders collection
  const ros = await roCollection
    .find({
      _id: {
        $in: roIds.map((id) =>
          typeof id === "string" ? new ObjectId(id) : id
        ),
      },
    })
    .toArray();

  console.log(
    `Successfully fetched ${ros.length} ROs for client ID: ${clientId}`
  );

  return ros;
};
