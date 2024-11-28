// src/validation/validation.js
export const validateOutbrainParams = (params) => {
    const errors = [];

    // Validate Campaign ID
    if (!params.campaignId) {
        errors.push('Campaign ID is required');
    }

    // Validate dates
    if (!params.from || !params.to) {
        errors.push('Both from and to dates are required');
    } else {
        const fromDate = new Date(params.from);
        const toDate = new Date(params.to);
        
        if (isNaN(fromDate.getTime())) {
            errors.push('Invalid from date format');
        }
        
        if (isNaN(toDate.getTime())) {
            errors.push('Invalid to date format');
        }
        
        if (fromDate > toDate) {
            errors.push('From date must be before or equal to to date');
        }
    }

    return errors;
};

// Original RO data validation
export const validateROData = (roData) => {
    const errors = [];

    if (!roData.client) errors.push('Client is required');
    if (!roData.description) errors.push('Description is required');
    if (!roData.targetClicks) errors.push('Target Clicks is required');
    if (!roData.budget) errors.push('Budget is required');

    return errors;
};