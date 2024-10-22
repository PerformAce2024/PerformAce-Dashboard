document.getElementById('loginButton').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    // Sign in using Firebase Auth
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // If sign-in is successful, get the ID token
        return userCredential.user.getIdToken();
      })
      .then((idToken) => {
        // Send the token to the backend for verification
        return fetch('http://localhost:8000/auth/verifyToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`, // Pass token in Authorization header
          },
        });
      })
      .then((response) => {
        if (!response.ok) {
          // If the backend returns an error response, stop further execution
          throw new Error('Token verification failed');
        }
        return response.json();
      })
      .then((data) => {
        // Redirect based on user role
        if (data.role === 'admin') {
          window.location.href = 'admin-dashboard.html'; // Redirect to admin dashboard
        } else if (data.role === 'client') {
          window.location.href = 'client-dashboard.html'; // Redirect to client dashboard
        } else {
          alert('Unauthorized access');
        }
      })
      .catch((error) => {
        console.error('Login error:', error);
        alert('Login failed: Incorrect email or password'); // Display error message on login failure
      });
  });
  