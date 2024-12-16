import { transformMgidData } from '../services/mgidService.js';

export async function getMgidTransformedData(req, res) {
    try {
        const { campaignId, from, to } = req.body; // Get values from request body
        const data = await transformMgidData(campaignId, from, to);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error in getMgidTransformedData:', error);
        res.status(500).json({ 
            message: 'Error retrieving MGID data', 
            error: error.message || error 
        });
    }
}