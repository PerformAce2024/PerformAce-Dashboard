// outbrainController.js

import {
  getOutbrainCampaignPerformanceResult,
  getOutbrainPerformanceByCountry,
  getOutbrainPerformanceByOS,
  getOutbrainPerformanceByBrowser,
  getOutbrainPerformanceByRegion,
  getOutbrainPerformanceByDomain,
  getOutbrainPerformanceByAds
} from '../services/outbrainService.js';

// Get Campaign Performance Result
export const getCampaignPerformanceResult = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Campaign Performance Result for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainCampaignPerformanceResult(campaignId, from, to);
      console.log('Campaign Performance Result fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Campaign Performance Result:', error.message);
      res.status(500).json({ message: 'Error fetching Campaign Performance Result', error: error.message });
  }
};

// Get Performance by Country
export const getPerformanceByCountry = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by Country for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByCountry(campaignId, from, to);
      console.log('Performance by Country fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by Country:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by Country', error: error.message });
  }
};

// Get Performance by OS
export const getPerformanceByOS = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by OS for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByOS(campaignId, from, to);
      console.log('Performance by OS fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by OS:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by OS', error: error.message });
  }
};

// Get Performance by Browser
export const getPerformanceByBrowser = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by Browser for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByBrowser(campaignId, from, to);
      console.log('Performance by Browser fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by Browser:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by Browser', error: error.message });
  }
};

// Get Performance by Region
export const getPerformanceByRegion = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by Region for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByRegion(campaignId, from, to);
      console.log('Performance by Region fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by Region:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by Region', error: error.message });
  }
};

// Get Performance by Domain
export const getPerformanceByDomain = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by Domain for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByDomain(campaignId, from, to);
      console.log('Performance by Domain fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by Domain:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by Domain', error: error.message });
  }
};

// Get Performance by Ads
export const getPerformanceByAds = async (req, res) => {
  const { campaignId } = req.params;
  const { from, to } = req.query;

  console.log(`Fetching Performance by Ads for Campaign ID: ${campaignId}, From: ${from}, To: ${to}`);

  try {
      const data = await getOutbrainPerformanceByAds(campaignId, from, to);
      console.log('Performance by Ads fetched successfully:', data);
      res.json(data);
  } catch (error) {
      console.error('Error fetching Performance by Ads:', error.message);
      res.status(500).json({ message: 'Error fetching Performance by Ads', error: error.message });
  }
};
