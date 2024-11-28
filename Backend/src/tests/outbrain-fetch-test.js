import { testOutbrainDataFetch } from '../services/fetchAllOutbrainServices.js';

console.log('Starting Outbrain fetch and store test...');
testOutbrainDataFetch()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });