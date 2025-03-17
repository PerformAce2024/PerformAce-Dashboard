// PerformAce-Dashboard/Backend/src/controllers/auth.controller.js
// import { saveAuthCredentials } from '../services/authService.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Controller to register a new user and save credentials
export const registerUser = async (req, res) => {
  try {
    console.log("Received registration request:", req.body);

    const authData = {
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    };

    // Save the new user credentials in the database (auth collection)
    console.log(`Attempting to register user with email: ${authData.email}`);
    const newUser = await saveAuthCredentials(authData);
    console.log(`User ${authData.email} registered successfully`);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Controller to handle user login and JWT token generation
export const loginUser = async (req, res) => {
  try {
    console.log("Received login request:", req.body);

    const { email, password } = req.body;
    console.log(`Attempting login for user with email: ${email}`);

    // Connect to MongoDB and find user in the auth collection
    const db = req.app.locals.db;
    const authCollection = await db.collection("auth");
    const user = await authCollection.findOne({ email });

    if (!user) {
      console.error(`Login failed: User with email ${email} not found`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error(`Login failed: Incorrect password for user ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token valid for 1 hour
    );
    console.log(`JWT token generated for user ${email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

// Controller to verify the JWT token and return user information
export const verifyUserToken = async (req, res) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    console.error("Authorization header is missing");
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  const token = authorizationHeader.split("Bearer ")[1];
  try {
    console.log("Verifying token:", token);

    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified for user: ${decodedToken.email}`);

    // Return user information based on token
    res.status(200).json({
      success: true,
      message: "Token verified successfully",
      data: decodedToken,
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
};
