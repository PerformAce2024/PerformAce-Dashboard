import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCQvJe0-NL3eD028sGVF5ULsJ65Vmz7TeQ",
    authDomain: "performacemedia-dashbaord.firebaseapp.com",
    projectId: "performacemedia-dashbaord",
    storageBucket: "performacemedia-dashbaord.appspot.com",
    messagingSenderId: "534541753220",
    appId: "1:534541753220:web:102e385b339255abe69bd1",
    measurementId: "G-W1NQY9X937"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
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
            window.location.href = '../admin/admin_homepage.html'; // Redirect to admin dashboard
        } else if (data.role === 'client') {
            window.location.href = '../client/client_dashboard.html'; // Redirect to client dashboard
        } else {
            alert('Unauthorized access');
        }
    })
      .catch((error) => {
        console.error('Login error:', error);
        alert('Login failed: Incorrect email or password'); // Display error message on login failure
      });
  });
  