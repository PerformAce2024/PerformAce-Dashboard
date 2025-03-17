import { getDb } from "../config/db.js";

export async function getClientName(req, res) {
  const { email } = req.params;
  let client;

  try {
    const db = req.app.locals.db;
    const campaign = await db
      .collection("clients")
      .findOne({ email: email }, { projection: { name: 1, _id: 0 } });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.json({ success: true, clientName: campaign.name });
  } catch (error) {
    console.error("Error fetching client name:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (client) await client.close();
  }
}
