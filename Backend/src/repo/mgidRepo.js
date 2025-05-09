import { getDb } from "../config/db.js";

class MgidRepo {
  static async saveMgidDataInDB(campaignData) {
    console.log("Connecting to MongoDB to save campaign data...");

    try {
      const db = await getDb();
      const campaignCollection = db.collection("mgidData");

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
    }
  }
}

export default MgidRepo;
