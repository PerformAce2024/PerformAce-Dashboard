export const validateROData = (roData) => {
    const errors = [];

    if (!roData.client) errors.push('Client is required');
    if (!roData.description) errors.push('Description is required');
    if (!roData.targetClicks) errors.push('Target Clicks is required');
    if (!roData.budget) errors.push('Budget is required');
    

    return errors;
};
