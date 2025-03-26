import { ObjectId } from "mongodb";

export const getCPCByRoId = async (req, res) => {
  try {
    const { roId } = req.params;

    const client = req.app.locals.db;

    const releaseOrder = await client
      .collection("releaseOrders")
      .findOne({ _id: new ObjectId(roId) });

    if (!releaseOrder) {
      return res.status(404).json({ message: "Release order not found" });
    }

    res.json({ cpc: releaseOrder.cpc, roNumber: releaseOrder.roNumber });
  } catch (error) {
    console.error("Error fetching CPC:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
