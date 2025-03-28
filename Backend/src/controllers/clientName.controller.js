export async function getClientName(req, res) {
  const { email } = req.params;

  try {
    const db = req.app.locals.db;
    const client = await db
      .collection("clients")
      .findOne({ email: email }, { projection: { name: 1, _id: 0 } });

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.json({ success: true, clientName: client.name });
  } catch (error) {
    console.error("Error fetching client name:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
