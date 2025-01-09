import { MongoClient } from 'mongodb';

export const getCPCByRoNumber = async (req, res) => {
    try {
        const { roNumber } = req.params;
        const client = await MongoClient.connect('mongodb+srv://PerformAce:uzWN5bunftYSxe2Y@cluster0.gmysq.mongodb.net/campaignAnalytics?retryWrites=true&w=majority&appName=Cluster0');
        const db = client.db('campaignAnalytics');
        
        const releaseOrder = await db.collection('releaseOrders')
            .findOne({ roNumber: roNumber });

        if (!releaseOrder) {
            return res.status(404).json({ message: 'Release order not found' });
        }

        res.json({ cpc: releaseOrder.cpc });
        client.close();
    } catch (error) {
        console.error('Error fetching CPC:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};