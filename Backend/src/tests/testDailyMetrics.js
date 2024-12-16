// src/tests/testDailyMetrics.js
import { testWithRealData } from '../services/campaignDailyMetricsService.js';

testWithRealData()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error));