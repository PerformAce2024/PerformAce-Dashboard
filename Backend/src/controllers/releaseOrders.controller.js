import { MongoClient, ObjectId } from "mongodb";

export const getCPCByRoId = async (req, res) => {
  try {
    const { roId } = req.params;
    console.log("This is receinved roID ", roId);

    const client = await MongoClient.connect(
      "mongodb+srv://PerformAce:uzWN5bunftYSxe2Y@cluster0.gmysq.mongodb.net/campaignAnalytics?retryWrites=true&w=majority&appName=Cluster0"
    );
    const db = client.db("campaignAnalytics");

    const releaseOrder = await db
      .collection("releaseOrders")
      .findOne({ _id: new ObjectId(roId) });

    if (!releaseOrder) {
      return res.status(404).json({ message: "Release order not found" });
    }

    res.json({ cpc: releaseOrder.cpc });
    client.close();
  } catch (error) {
    console.error("Error fetching CPC:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
