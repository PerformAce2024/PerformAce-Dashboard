import jwt from "jsonwebtoken";
import { connectToMongo } from "../config/db.js"; // MongoDB connection

export const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  const token =
    authorizationHeader && authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.split(" ")[1]
      : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Token is missing or improperly formatted" });
  }

  try {
    // Verify the token using JWT and the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;
    console.log("Token verified for user:", userEmail);

    // Connect to MongoDB
    const client = req.app.locals.db;
    const adminCollection = await client.collection("admin");

    // Check if the admin with the email exists in the admin collection
    const adminUser = await adminCollection.findOne({ email: userEmail });

    if (!adminUser) {
      return res.status(401).json({ error: "Admin not found" });
    }

    // Attach the admin details to the request object
    req.user = {
      email: adminUser.email,
      role: adminUser.role,
      token,
    };

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res
      .status(401)
      .json({ error: "Token verification failed", details: error.message });
  }
};
