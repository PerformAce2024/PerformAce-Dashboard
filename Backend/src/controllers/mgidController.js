import { transformMgidData } from '../services/mgidService.js';

export async function getMgidTransformedData(req, res) {
    try {
        const data = await transformMgidData();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error in getMgidTransformedData:', error); // Log detailed error information
        res.status(500).json({ message: 'Error retrieving MGID data', error: error.message || error });
    }
}
