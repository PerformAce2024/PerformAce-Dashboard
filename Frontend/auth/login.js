// login.js

// Login button click event
document.getElementById('loginButton').addEventListener('click', async (e) => {
    e.preventDefault();  // Prevent default form submission behavior
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store the JWT token in localStorage
            localStorage.setItem('authToken', data.token);

            // Redirect based on user role
            if (data.role === 'admin') {
                window.location.href = '../admin/admin_homepage.html';
            } else if (data.role === 'sales') {
                window.location.href = '../sales/sales_dashboard.html';
            } else if (data.role === 'client') {
                window.location.href = '../client/client_dashboard.html';
            } else {
                alert('Unauthorized role.');
            }
        } else {
            alert(data.message || 'Login failed.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed.');
    }
});

// Function to make an authenticated API request
function makeAuthenticatedRequest(url, method, body = null) {
    const token = localStorage.getItem('authToken');  // Get the token from localStorage
    if (!token) {
        alert('No token found! Please login.');
        return;
    }

    // Make the fetch request with the token in the Authorization header
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Attach the JWT token here
        },
        body: body ? JSON.stringify(body) : null
    })
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
}
