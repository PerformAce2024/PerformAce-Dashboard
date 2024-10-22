import { connectToMongo } from "../config/db.js";

export const submitCampaign = async (req, res) => {
    try {
        const { clientName, roName, campaignId } = req.body;

        // Save the campaign details to the database (you can define your own logic here)
        const campaignData = {
            clientName,
            email,
            roName,
            campaignId,
            createdAt: new Date(),
        };

        // Assuming you save it to a 'campaigns' collection in MongoDB
        const client = await connectToMongo();
        const campaignCollection = client.db('campaignAnalytics').collection('campaigns');
        await campaignCollection.insertOne(campaignData);

        res.status(200).json({ success: true, message: 'Campaign submitted successfully' });
    } catch (error) {
        console.error('Error submitting campaign:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
