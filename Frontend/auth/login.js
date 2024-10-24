document.addEventListener('DOMContentLoaded', () => {

    // Clear any existing session data (so you can test the login process fresh)
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');

    // Login button click event
    document.getElementById('loginButton').addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            alert('Email and password are required.');
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store JWT token and role in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userEmail', email);  // Save the email

                // Redirect based on role
                redirectToRolePage(data.role);
            } else {
                alert(data.message || 'Login failed.');
            }
        } catch (error) {
            alert('Login error. Please try again.');
        }
    });

    // Function to redirect user based on their role
    function redirectToRolePage(role) {
        if (role === 'admin') {
            window.location.href = '../admin/admin_homepage.html';
        } else if (role === 'Sales') {
            window.location.href = '../sales/sales_homepage.html';
        } else if (role === 'Client') {
            window.location.href = '../client/client_homepage.html';
        } else {
            alert('Unauthorized role.');
        }
    }

    // The session check is disabled to prevent automatic redirection in testing mode
    // checkUserSession();  // Commented out during testing

});
