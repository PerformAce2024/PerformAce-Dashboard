// // PerformAce-Dashboard/Frontend/auth/firebase.js
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";
// import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; 

// // Firebase configuration for PerformAce Media Dashboard
// const firebaseConfig = {
//   apiKey: "AIzaSyCQvJe0-NL3eD028sGVF5ULsJ65Vmz7TeQ",
//   authDomain: "performacemedia-dashbaord.firebaseapp.com",
//   projectId: "performacemedia-dashbaord",
//   storageBucket: "performacemedia-dashbaord.appspot.com",
//   messagingSenderId: "534541753220",
//   appId: "1:534541753220:web:102e385b339255abe69bd1",
//   measurementId: "G-W1NQY9X937"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const auth = getAuth();

// // Add click event listener to the login button
// document.getElementById('loginButton').addEventListener('click', () => {
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;

//   if (!email || !password) {
//     alert('Please enter both email and password');
//     return;
//   }

//   console.log('Attempting login with email:', email);

//   // Sign in using Firebase Auth
//   signInWithEmailAndPassword(auth, email, password)
//     .then((userCredential) => {
//       console.log('Login successful, fetching ID token...');
//       // Get the ID token after sign-in
//       return userCredential.user.getIdToken();
//     })
//     .then((idToken) => {
//       console.log('ID token retrieved, sending token to backend for verification...');
//       // Send the token to the backend for verification
//       return fetch('http://backend-api.performacemedia.int:8000/auth/verifyToken', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${idToken}`, // Pass token in Authorization header
//         },
//       });
//     })
//     .then((response) => {
//       if (!response.ok) {
//         console.error('Token verification failed with status:', response.status);
//         throw new Error('Token verification failed');
//       }
//       return response.json();
//     })
//     .then((data) => {
//       console.log('Token verified successfully, user role:', data.role);
//       // Redirect based on user role
//       if (data.role === 'admin') {
//         console.log('Redirecting to admin dashboard...');
//         window.location.href = '../admin/admin_homepage.html'; // Redirect to admin dashboard
//       } else if (data.role === 'client') {
//         console.log('Redirecting to client dashboard...');
//         window.location.href = '../client/client_dashboard.html'; // Redirect to client dashboard
//       } else {
//         console.warn('Unauthorized access attempt, role:', data.role);
//         alert('Unauthorized access');
//       }
//     })
//     .catch((error) => {
//       console.error('Login error:', error);
//       alert('Login failed: Incorrect email or password'); // Display error message on login failure
//     });
// });
