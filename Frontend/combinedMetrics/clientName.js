const fetchAndDisplayUserInfo = async () => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`https://backend-api.performacemedia.com:8000/api/clientname/${email}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
 
        const data = await response.json();
        
        if (data.success) {
            // Update sidebar client name
            const sidebarName = document.querySelector('.info-card .text-truncate-sm');
            if (sidebarName) {
                sidebarName.textContent = data.clientName;
            }
 
            // Update dropdown header
            const dropdownName = document.querySelector('.fs-lg.text-truncate-lg');
            const dropdownEmail = document.querySelector('.text-truncate-md.opacity-80');
            if (dropdownName) {
                dropdownName.textContent = data.clientName;
            }
            if (dropdownEmail) {
                dropdownEmail.textContent = email;
            }
 
            // Update logout @mention
            const logoutSpan = document.querySelector('a[href="../page_login.html"] .float-right.fw-n');
            if (logoutSpan) {
                logoutSpan.textContent = `@${data.clientName}`;
            }
 
            // Reset shortcuts
            document.querySelector('a[data-action="app-fullscreen"] .float-right').textContent = 'F11';
            document.querySelector('a[data-action="app-print"] .float-right').textContent = 'Ctrl + P';
        }
    } catch (error) {
        console.error('Error:', error);
    }
 };
 
 if (typeof window.initializeUserInfo === 'undefined') {
    window.initializeUserInfo = () => {
        const email = localStorage.getItem('userEmail');
        if (email) fetchAndDisplayUserInfo();
    };
    window.fetchAndDisplayUserInfo = fetchAndDisplayUserInfo;
    window.initializeUserInfo();
 }