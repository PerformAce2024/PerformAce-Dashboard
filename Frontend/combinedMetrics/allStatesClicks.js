// Function to fetch state performance data from API
const fetchStatePerformanceData = async () => {
  try {
      const apiUrl = 'http://localhost:8000/api/metrics/region?clientEmail=agarwal11srishti@gmail.com&startDate=2024-10-26&endDate=2024-10-27';
      const response = await fetch(apiUrl);

      if (!response.ok) {
          throw new Error(`Failed to fetch state performance data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched data:', data); // Debug log
      
      if (!data.allClicksData || !Array.isArray(data.allClicksData)) {
          console.error('allClicksData is not available or is not an array:', data);
          return;
      }

      updateMapTotalClicks(data.totalClicks);
      mapDataToSvgElements(data.allClicksData);
  } catch (error) {
      console.error('Error fetching state performance data:', error);
  }
};

// Function to map data to SVG paths
const mapDataToSvgElements = (allClicksData) => {
  console.log('Starting to map data:', allClicksData); // Debug log
  const svgPaths = document.querySelectorAll('path.land');
  console.log('Found paths:', svgPaths.length); // Debug log
  
  // Initialize all paths with white fill
  svgPaths.forEach(path => {
      path.style.fill = '#ffffff';
  });
  
  svgPaths.forEach((path) => {
      const stateName = path.getAttribute('title');
      console.log('Processing state:', stateName); // Debug log
      
      const matchingState = allClicksData.find(item => {
          const itemState = item.state.toLowerCase().trim();
          const pathState = stateName.toLowerCase().trim();
          console.log(`Comparing: ${itemState} with ${pathState}`); // Debug log
          return itemState === pathState;
      });

      if (matchingState) {
          console.log('Found matching state data:', matchingState); // Debug log
          
          // Add hover events
          path.addEventListener('mousemove', (event) => {
              const svgRect = event.target.ownerSVGElement.getBoundingClientRect();
              const mouseX = event.clientX - svgRect.left;
              const mouseY = event.clientY - svgRect.top;
              
              // Scale coordinates to SVG viewBox
              const svg = event.target.ownerSVGElement;
              const viewBox = svg.viewBox.baseVal;
              const scaleX = viewBox.width / svgRect.width;
              const scaleY = viewBox.height / svgRect.height;
              
              const svgX = mouseX * scaleX;
              const svgY = mouseY * scaleY;
              
              const tooltipText = `${stateName}: ${matchingState.clicks.toLocaleString()} clicks`;
              console.log('Showing tooltip:', tooltipText); // Debug log
              showTooltip(svgX, svgY, tooltipText);
          });

          path.addEventListener('mouseleave', hideTooltip);
      }
  });
};

// Function to show tooltip
const showTooltip = (x, y, text) => {
    const tooltip = document.getElementById('tooltip');
    const tooltipBg = document.getElementById('tooltip_bg');
  

    if (!tooltip || !tooltipBg) {
        console.error('Tooltip elements not found!'); // Debug log
        return;
    }

    // Set tooltip text and log it for debugging
    tooltip.textContent = text;
    console.log('Setting tooltip text:', text); // Debug log
      console.log('Tooltip text being set:', text);
    // Calculate background size and position
    const bbox = tooltip.getBBox();
    const padding = 10;
    const bgWidth = bbox.width + (padding * 2);
    const bgHeight = bbox.height + (padding * 2);
    
    const tooltipX = x + 10;
    const tooltipY = y - 10;
    
    tooltip.setAttribute('x', tooltipX);
    tooltip.setAttribute('y', tooltipY);
    
    tooltipBg.setAttribute('x', tooltipX - padding);
    tooltipBg.setAttribute('y', tooltipY - bbox.height - padding / 2);
    tooltipBg.setAttribute('width', bgWidth);
    tooltipBg.setAttribute('height', bgHeight);

    // Make tooltip and background visible
    tooltipBg.setAttribute('visibility', 'visible');
    tooltip.setAttribute('visibility', 'visible');
};

// Function to hide tooltip
const hideTooltip = () => {
  const tooltip = document.getElementById('tooltip');
  const tooltipBg = document.getElementById('tooltip_bg');
  
  if (tooltip) tooltip.setAttribute('visibility', 'hidden');
  if (tooltipBg) tooltipBg.setAttribute('visibility', 'hidden');
};

// Function to update total clicks display
const updateMapTotalClicks = (totalClicks) => {
  const totalClicksElement = document.querySelector('.js-jqvmap-country');
  if (totalClicksElement) {
      totalClicksElement.textContent = `India - ${totalClicks.toLocaleString()}`;
  }
};

// Add necessary CSS styles
const style = document.createElement('style');
style.textContent = `
  .land {
      stroke: #999999;
      stroke-width: 0.5;
      vector-effect: non-scaling-stroke;
      transition: fill 0.3s;
  }
  .land:hover {
      fill: #f0f0f0 !important;
  }
  .tooltip {
      font-family: Arial, sans-serif;
      font-size: 14px;
      fill: #ed1c1c;
      dominant-baseline: hanging;
      pointer-events: none;
  }
  .tooltip_bg {
      fill: rgba(0, 0, 0, 0.8);
      pointer-events: none;
  }
`;
document.head.appendChild(style);

// Initialize the map
document.addEventListener('DOMContentLoaded', () => {
  // First ensure tooltip elements exist
  const svg = document.querySelector('svg');
  if (!document.getElementById('tooltip')) {
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute('id', 'tooltip');
      tooltip.setAttribute('class', 'tooltip');
      tooltip.setAttribute('visibility', 'hidden');
      svg.appendChild(tooltip);
  }
  
  if (!document.getElementById('tooltip_bg')) {
      const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tooltipBg.setAttribute('id', 'tooltip_bg');
      tooltipBg.setAttribute('class', 'tooltip_bg');
      tooltipBg.setAttribute('visibility', 'hidden');
      svg.insertBefore(tooltipBg, svg.firstChild);
  }
  
  fetchStatePerformanceData();
});