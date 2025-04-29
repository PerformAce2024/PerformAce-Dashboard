import {
  createROInDB,
  getAllROsFromDB,
  getROsForClientFromDB,
  updateSalespeopleWithRO,
} from "../services/roService.js";

export const createRO = async (req, res) => {
  try {
    // Extracting RO data from the request body
    const roData = {
      ro_name: req.body.ro_name,
      targetClicks: req.body.targetClicks,
      budget: req.body.budget,
      cpc: req.body.cpc,
      cpm: req.body.cpm,
      soldBy: req.body.soldBy,
      saleDate: req.body.saleDate,
      roNumber: req.body.roNumber,
      service: req.body.service, // Add service data to the RO
    };

    // Call the service to create the RO in the database
    const createdRO = await createROInDB(roData);
    await updateSalespeopleWithRO(roData.soldBy, createdRO.insertedId);
    // Respond with the created RO data
    res.status(201).json({ success: true, data: createdRO });
  } catch (error) {
    console.error("Error creating RO:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all ROs with logging
export const getAllROs = async (req, res) => {
  try {
    // Call the service to get all ROs from the database
    const ros = await getAllROsFromDB();
    // Respond with the list of ROs
    res.status(200).json({ success: true, data: ros });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getROsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required",
      });
    }
    const ros = await getROsForClientFromDB(clientId);

    // Respond with the list of ROs for this client
    res.status(200).json({ success: true, data: ros });
  } catch (error) {
    console.error("Error fetching ROs by client ID:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
