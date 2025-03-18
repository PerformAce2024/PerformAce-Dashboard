import { getDb } from "../config/db.js";

export const saveCampaignMapping = async (mappingData) => {
  console.log("Saving campaign mapping:", mappingData);
  const { clientName, roNumber, platform, campaignId } = mappingData;

  if (!clientName || !roNumber || !platform || !campaignId) {
    throw new Error("Missing required fields for campaign mapping");
  }

  const clientDb = await getDb();
  if (!clientDb) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }

  const campaignMappingsCollection = clientDb.collection("campaignMappings");

  // Check if a document with this clientName already exists
  const existingMapping = await campaignMappingsCollection.findOne({
    clientName,
  });

  if (!existingMapping) {
    // Create a new mapping document
    const newMapping = {
      clientName,
      mappings: [
        {
          roNumber,
          taboolaCampaignId: platform === "taboola" ? [campaignId] : [],
          outbrainCampaignId: platform === "outbrain" ? [campaignId] : [],
          dspOutbrainCampaignId: platform === "dspoutbrain" ? [campaignId] : [],
          mgidCampaignId: platform === "mgid" ? [campaignId] : [],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await campaignMappingsCollection.insertOne(newMapping);
    console.log("New campaign mapping created:", result.insertedId);
    return { insertedId: result.insertedId, ...newMapping };
  } else {
    // Check if there's already a mapping for this RO number
    const roMappingIndex = existingMapping.mappings.findIndex(
      (m) => m.roNumber === roNumber
    );

    if (roMappingIndex >= 0) {
      // RO exists, update the appropriate campaign ID array
      const platformField = getPlatformField(platform);

      // If the platform field doesn't exist, create it
      if (!existingMapping.mappings[roMappingIndex][platformField]) {
        existingMapping.mappings[roMappingIndex][platformField] = [];
      }

      // Add campaign ID to the array if it doesn't already exist
      if (
        !existingMapping.mappings[roMappingIndex][platformField].includes(
          campaignId
        )
      ) {
        existingMapping.mappings[roMappingIndex][platformField].push(
          campaignId
        );
      }

      // Update the document in the database
      const result = await campaignMappingsCollection.updateOne(
        { clientName },
        {
          $set: {
            mappings: existingMapping.mappings,
            updatedAt: new Date(),
          },
        }
      );

      console.log("Updated existing campaign mapping:", result.modifiedCount);
      return { modifiedCount: result.modifiedCount, ...existingMapping };
    } else {
      // RO doesn't exist for this client, add a new mapping
      const newMapping = {
        roNumber,
        taboolaCampaignId: platform === "taboola" ? [campaignId] : [],
        outbrainCampaignId: platform === "outbrain" ? [campaignId] : [],
        dspOutbrainCampaignId: platform === "dspoutbrain" ? [campaignId] : [],
        mgidCampaignId: platform === "mgid" ? [campaignId] : [],
      };

      // Add the new mapping to the array
      existingMapping.mappings.push(newMapping);

      // Update the document in the database
      const result = await campaignMappingsCollection.updateOne(
        { clientName },
        {
          $set: {
            mappings: existingMapping.mappings,
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        "Added new RO mapping for existing client:",
        result.modifiedCount
      );
      return { modifiedCount: result.modifiedCount, ...existingMapping };
    }
  }
};

// Helper function to get the correct field name for the platform
function getPlatformField(platform) {
  switch (platform.toLowerCase()) {
    case "taboola":
      return "taboolaCampaignId";
    case "outbrain":
      return "outbrainCampaignId";
    case "dspoutbrain":
      return "dspOutbrainCampaignId";
    case "mgid":
      return "mgidCampaignId";
    default:
      return `${platform.toLowerCase()}CampaignId`;
  }
}

// Function to get campaign IDs for a specific client and RO
export const getCampaignMappings = async (clientName, roNumber = null) => {
  const clientDb = await getDb();
  if (!clientDb) {
    throw new Error("MongoDB connection failed");
  }

  const campaignMappingsCollection = clientDb.collection("campaignMappings");

  // Find mappings for this client
  const clientMapping = await campaignMappingsCollection.findOne({
    clientName,
  });

  if (!clientMapping) {
    return { mappings: [] };
  }

  // If RO number is specified, filter to just that RO
  if (roNumber) {
    const roMapping = clientMapping.mappings.find(
      (m) => m.roNumber === roNumber
    );
    return { mappings: roMapping ? [roMapping] : [] };
  }

  return clientMapping;
};

// Function to get a specific campaign ID from the mappings
export const getCampaignIdFromMapping = async (
  clientName,
  roNumber,
  platform
) => {
  const clientMapping = await getCampaignMappings(clientName, roNumber);

  if (
    !clientMapping ||
    !clientMapping.mappings ||
    clientMapping.mappings.length === 0
  ) {
    return null;
  }

  const roMapping = clientMapping.mappings[0]; // We filtered by RO, so there should be only one
  const platformField = getPlatformField(platform);

  // Return the most recently added campaign ID for this platform (last in the array)
  return roMapping[platformField] && roMapping[platformField].length > 0
    ? roMapping[platformField][roMapping[platformField].length - 1]
    : null;
};
