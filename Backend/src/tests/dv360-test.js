// src/tests/dv360.test.js
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
// import dv360Service from '../services/dv360Service.js';
import dotenv from 'dotenv';

dotenv.config();

describe('DV360Service Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  const sampleData = {
    campaignId: '42938360',
    key: ['1356166266', '4880732303'],
    metadata: {
      state: 'DONE',
      finishTime: '2024-12-05T11:04:05Z',
      format: 'CSV'
    },
    startDate: '2024-11-28',
    endDate: '2024-12-04',
    reportUrl: 'https://storage.googleapis.com/test-url',
    reportType: 'STANDARD',
    groupByFields: [
      'FILTER_ADVERTISER_NAME',
      'FILTER_ADVERTISER'
    ],
    filters: [
      { type: 'FILTER_ADVERTISER', value: '6783985134' }
    ],
    metrics: ['METRIC_IMPRESSIONS', 'METRIC_CLICKS'],
    campaignPerformanceResult: {
      'last-used-rawdata-update-time': '2024-11-19 10:30:00.0',
      results: []
    }
  };

  test('should save DV360 data successfully', async () => {
    const savedData = await dv360Service.saveDV360Data(sampleData);
    expect(savedData.campaignId).toBe(sampleData.campaignId);
    expect(savedData.queryId).toBe(sampleData.key[0]);
    expect(savedData.reportId).toBe(sampleData.key[1]);
  });

  test('should fetch DV360 data by campaign ID', async () => {
    await dv360Service.saveDV360Data(sampleData);
    const fetchedData = await dv360Service.getDV360Data(sampleData.campaignId);
    expect(fetchedData).toHaveLength(1);
    expect(fetchedData[0].campaignId).toBe(sampleData.campaignId);
  });

  test('should update existing DV360 data', async () => {
    const savedData = await dv360Service.saveDV360Data(sampleData);
    const updatedData = {
      ...sampleData,
      reportType: 'UPDATED'
    };
    const result = await dv360Service.saveDV360Data(updatedData);
    expect(result.reportType).toBe('UPDATED');
    expect(result._id.toString()).toBe(savedData._id.toString());
  });

  test('should handle invalid data gracefully', async () => {
    const invalidData = {};
    await expect(dv360Service.saveDV360Data(invalidData)).rejects.toThrow();
  });
});