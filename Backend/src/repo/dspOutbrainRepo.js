import { connectToMongo, getDb } from "../config/db.js";

class DspOutbrainRepo {
  static async saveDspOutbrainDataInDB(campaignData) {
    console.log("Connecting to MongoDB to save campaign data...");
    const clientDb = await getDb();

    if (!clientDb) {
      console.error("MongoDB connection failed");
      throw new Error("MongoDB connection failed");
    }

    try {
      const campaignCollection = clientDb.collection("dspOutbrainData");

      const newCampaign = { ...campaignData, createdAt: new Date() };
      console.log(
        "Inserting new campaign data into the database:",
        newCampaign
      );

      const result = await campaignCollection.insertOne(newCampaign);
      console.log(
        "Campaign data saved successfully with ID:",
        result,
        result.insertedId
      );

      return { insertedId: result.insertedId, ...newCampaign };
    } catch (error) {
      console.error("Error saving campaign data:", error);
      throw new Error("Failed to save campaign data");
    } finally {
      await clientDb.close(); // Ensure the connection is closed
    }
  }
}

export default DspOutbrainRepo;
