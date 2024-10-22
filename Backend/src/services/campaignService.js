import { connectToMongo } from "../config/db.js";

// Function to save campaign data to the database
export const saveCampaignDataInDB = async (campaignData) => {
    const clientDb = await connectToMongo();
    if (!clientDb) throw new Error("MongoDB connection failed");

    const db = clientDb.db("campaignAnalytics");
    const campaignCollection = db.collection("campaigns");

    const newCampaign = { ...campaignData, createdAt: new Date() };
    const result = await campaignCollection.insertOne(newCampaign);

    return { insertedId: result.insertedId, ...newCampaign };
};

export const getCampaignIdsFromDB = async (clientId, roName) => {
    const clientDb = await connectToMongo();
    if (!clientDb) throw new Error("MongoDB connection failed");

    const db = clientDb.db("campaignAnalytics");
    const campaignCollection = db.collection("campaigns");

    // Query campaigns based on clientId and RO name
    const campaigns = await campaignCollection
        .find({ clientId: clientId, roName: roName })
        .project({ campaignId: 1 })  // Only return campaignId field
        .toArray();

    return campaigns.map(campaign => campaign.campaignId);  // Return an array of campaign IDs
};
