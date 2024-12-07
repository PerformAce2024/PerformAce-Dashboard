import mongoose from 'mongoose';

const DV360DataSchema = new mongoose.Schema({
  campaignId: { type: String, required: true },
  queryId: { type: String, required: true },
  reportId: { type: String, required: true },
  metadata: {
    state: String,
    finishTime: Date,
    format: String
  },
  startDate: Date,
  endDate: Date,
  reportType: { type: String, default: 'STANDARD' },
  reportData: {
    metrics: {
      impressions: Number,
      clicks: Number,
      conversions: Number,
      spent: Number
    },
    dimensions: {
      region: String,
      browser: String,
      platform: String
    }
  },
  dateStored: { type: Date, default: Date.now }
}, {
  collection: 'dv360Data'  // Explicitly set collection name
});

export default mongoose.model('DV360Data', DV360DataSchema);