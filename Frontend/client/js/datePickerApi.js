$(document).ready(function () {
    const startOfMonth = moment().startOf('month');
    const today = moment();

    $('#datepicker-1').daterangepicker({
        opens: 'left',
        locale: {
            format: 'YYYY-MM-DD'
        },
        startDate: startOfMonth,
        endDate: today,
        alwaysShowCalendars: true,
        ranges: {
            'Today': [moment(), moment()],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment()]
        }
    }, function(start, end) {
        // Store dates in sessionStorage
        sessionStorage.setItem('startDate', start.format('YYYY-MM-DD'));
        sessionStorage.setItem('endDate', end.format('YYYY-MM-DD'));

        // Update all data components
        updateAllComponents();
    });
});

function updateAllComponents() {
    const selectedRO = sessionStorage.getItem('selectedRO');
    const startDate = sessionStorage.getItem('startDate');
    const endDate = sessionStorage.getItem('endDate');

    // Update campaign daily metrics
    if (typeof fetchAndDisplayCombinedMetrics === 'function') {
        fetchAndDisplayCombinedMetrics(selectedRO, startDate, endDate);
    }

    // Update geo performance data
    if (typeof fetchGeoPerformanceData === 'function') {
        fetchGeoPerformanceData(selectedRO, startDate, endDate);
    }

    // Add other component updates here as we handle more files
    // Example:
    // if (typeof fetchOtherMetrics === 'function') {
    //     fetchOtherMetrics(selectedRO, startDate, endDate);
    // }
}