import { getDb } from "../config/db.js";

// Function to save campaign data to the database
export const saveCampaignDataInDB = async (campaignData) => {
  console.log("Connecting to MongoDB to save campaign data...");
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const campaignCollection = clientDb.collection("campaigns");

  const newCampaign = { ...campaignData, createdAt: new Date() };
  console.log("Inserting new campaign into the database:", newCampaign);
  const result = await campaignCollection.insertOne(newCampaign);
  console.log("Campaign data saved successfully with ID:", result.insertedId);

  return { insertedId: result.insertedId, ...newCampaign };
};

// Function to retrieve campaign IDs from the database based on clientId and RO name
export const getCampaignIdsFromDB = async (clientId, roName) => {
  console.log("Connecting to MongoDB to retrieve campaign IDs...");
  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const campaignCollection = clientDb.collection("campaigns");

  console.log(
    `Querying campaigns for clientId: ${clientId} and roName: ${roName}`
  );
  // Query campaigns based on clientId and RO name
  const campaigns = await campaignCollection
    .find({ clientId: clientId, roName: roName })
    .project({ campaignId: 1 }) // Only return campaignId field
    .toArray();

  console.log("Campaigns found:", campaigns);

  // Return an array of campaign IDs
  return campaigns.map((campaign) => campaign.campaignId);
};
