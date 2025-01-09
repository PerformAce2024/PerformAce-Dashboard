// mapping.js
export const regionToStateMapping = {
    'India-Andaman and Nicobar Islands': 'Andaman & Nicobar Island',
    'India-Andhra Pradesh Region': 'Andhra Pradesh',
    'India-Vijayawada City': 'Andhra Pradesh',
    'India-Andaman and Nicobar Islands': 'Andaman & Nicobar Island',
    'India-Andhra Pradesh Region': 'Andhra Pradesh',
    'India-Vijayawada City': 'Andhra Pradesh',
    'India-Visakhapatnam City': 'Andhra Pradesh',
    'India-Arunachal Pradesh': 'Arunachal Pradesh',
    'India-Assam': 'Assam',
    'India-Bihar Region': 'Bihar',
    'India-Patna City': 'Bihar',
    'India-Chandigarh': 'Chandigarh',
    'India-Chattisgarh Region': 'Chhattisgarh',
    'India-Raipur City': 'Chhattisgarh',
    'India-Delhi City': 'Delhi',
    'India-Delhi Region': 'Delhi',
    'India-Goa': 'Goa',
    'India-Ahmedabad City': 'Gujarat',
    'India-Gujarat Region': 'Gujarat',
    'India-Rajkot City': 'Gujarat',
    'India-Surat City': 'Gujarat',
    'India-Vadodara City': 'Gujarat',
    'India-Faridabad City': 'Haryana',
    'India-Gurugram City': 'Haryana',
    'India-Haryana Region': 'Haryana',
    'India-Himachal Pradesh': 'Himachal Pradesh',
    'India-Jammu and Kashmir Region': 'Jammu And Kashmir',
    'India-Srinagar City': 'Jammu And Kashmir',
    'India-Dhanbad City': 'Jharkhand',
    'India-Jharkhand Region': 'Jharkhand',
    'India-Ranchi City': 'Jharkhand',
    'India-Bangalore City': 'Karnataka',
    'India-Karnataka Region': 'Karnataka',
    'India-Mysore City': 'Karnataka',
    'India-Kerala': 'Kerala',
    'India-Kochi City': 'Kerala',
    'India-Thiruvananthapuram City': 'Kerala',
    'India-Thrissur City': 'Kerala',
    'India-Wayanad': 'Kerala',
    'India-Lakshadweep': 'Lakshadweep',
    'India-Bhopal City': 'Madhya Pradesh',
    'India-Gwalior City': 'Madhya Pradesh',
    'India-Indore City': 'Madhya Pradesh',
    'India-Jabalpur City': 'Madhya Pradesh',
    'India-Madhya Pradesh Region': 'Madhya Pradesh',
    'India-Aurangabad City': 'Maharashtra',
    'India-Maharashtra Region': 'Maharashtra',
    'India-Mumbai City': 'Maharashtra',
    'India-Nagpur City': 'Maharashtra',
    'India-Nashik City': 'Maharashtra',
    'India-Navi Mumbai City': 'Maharashtra',
    'India-Pimpri-Chinchwad City': 'Maharashtra',
    'India-Pune City': 'Maharashtra',
    'India-Vasai-Virar City': 'Maharashtra',
    'India-Manipur': 'Manipur',
    'India-Meghalaya': 'Meghalaya',
    'India-Mizoram': 'Mizoram',
    'India-Nagaland': 'Nagaland',
    'India-Orissa': 'Odisha',
    'India-Puducherry': 'Puducherry',
    'India-Amritsar City': 'Punjab',
    'India-Ludhiana City': 'Punjab',
    'India-Punjab Region': 'Punjab',
    'India-Jaipur City': 'Rajasthan',
    'India-Jodhpur City': 'Rajasthan',
    'India-Kota City': 'Rajasthan',
    'India-Rajasthan Region': 'Rajasthan',
    'India-Sikkim': 'Sikkim',
    'India-Chennai City': 'Tamil Nadu',
    'India-Coimbatore City': 'Tamil Nadu',
    'India-Madurai City': 'Tamil Nadu',
    'India-Salem City': 'Tamil Nadu',
    'India-Tamil Nadu Region': 'Tamil Nadu',
    'India-Hyderabad City': 'Telangana',
    'India-Telangana': 'Telangana',
    'India-Tripura': 'Tripura',
    'India-Agra City': 'Uttar Pradesh',
    'India-Allahabad City': 'Uttar Pradesh',
    'India-Ghaziabad City': 'Uttar Pradesh',
    'India-Greater Noida City': 'Uttar Pradesh',
    'India-Kanpur City': 'Uttar Pradesh',
    'India-Lucknow City': 'Uttar Pradesh',
    'India-Meerut City': 'Uttar Pradesh',
    'India-Noida City': 'Uttar Pradesh',
    'India-Uttar Pradesh Region': 'Uttar Pradesh',
    'India-Varanasi City': 'Uttar Pradesh',
    'India-Uttarakhand': 'Uttarakhand',
    'India-Howrah City': 'West Bengal',
    'India-Kolkata City': 'West Bengal',
    'India-West Bengal Region': 'West Bengal'
};

// mapping.js

export function distributeOtherRegions(stateAggregates, otherRegionsData) {
    const otherClicks = parseInt(otherRegionsData.Clicks) || 0;
    const otherSpent = parseFloat(otherRegionsData['Spent, INR']) || 0;
    const states = Object.keys(stateAggregates);
    const stateCount = states.length;

    if (stateCount === 0 || otherClicks === 0) return;

    const sortedStates = states.sort((a, b) => 
        stateAggregates[b].Clicks - stateAggregates[a].Clicks
    );

    let remainingClicks = otherClicks;
    let remainingSpent = otherSpent;
    
    const top3StatesClicks = sortedStates.slice(0, 3).reduce((sum, state) => 
        sum + stateAggregates[state].Clicks, 0
    );

    sortedStates.slice(0, 3).forEach((state) => {
        const share = stateAggregates[state].Clicks / top3StatesClicks;
        const additionalClicks = Math.round(otherClicks * share);
        const additionalSpent = otherSpent * share;

        stateAggregates[state].Clicks += additionalClicks;
        stateAggregates[state]['Spent, INR'] = (parseFloat(stateAggregates[state]['Spent, INR']) + additionalSpent).toFixed(2);
        
        remainingClicks -= additionalClicks;
        remainingSpent -= additionalSpent;
    });

    if (remainingClicks > 0) {
        stateAggregates[sortedStates[0]].Clicks += remainingClicks;
        stateAggregates[sortedStates[0]]['Spent, INR'] = (parseFloat(stateAggregates[sortedStates[0]]['Spent, INR']) + remainingSpent).toFixed(2);
    }
}

export function aggregateRegionDataByState(regionData) {
    const stateAggregates = {};
    let otherRegionsData = null;
    
    regionData.forEach(record => {
        if (record.Region === 'India-Other regions') {
            otherRegionsData = record;
            return;
        }

        const state = regionToStateMapping[record.Region] || record.Region;
        
        if (!stateAggregates[state]) {
            stateAggregates[state] = {
                State: state,
                Clicks: 0,
                'Spent, INR': '0',
                Percent: '0',
                date_value: record.date_value
            };
        }
        
        stateAggregates[state].Clicks += parseInt(record.Clicks) || 0;
        stateAggregates[state]['Spent, INR'] = (parseFloat(stateAggregates[state]['Spent, INR']) + parseFloat(record['Spent, INR'] || 0)).toFixed(2);
    });

    if (otherRegionsData) {
        distributeOtherRegions(stateAggregates, otherRegionsData);
    }

    const totalClicks = Object.values(stateAggregates).reduce((sum, state) => sum + state.Clicks, 0);
    Object.values(stateAggregates).forEach(state => {
        state.Percent = ((state.Clicks / totalClicks) * 100).toFixed(2);
    });

    return Object.values(stateAggregates);
}