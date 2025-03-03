import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToMongo } from "./src/config/db.js";
import authRoute from "./src/routes/auth.routes.js";
import adminRoute from "./src/routes/admin.routes.js";
import mgidRoutes from "./src/routes/mgid.routes.js";
import outbrainRoutes from "./src/routes/outbrain.route.js";
import taboolaRoutes from "./src/routes/taboola.route.js";
import combinedMetricsRoutes from "./src/routes/combinedMetrics.route.js";
import emailRoutes from "./src/routes/email.routes.js";
import roRoutes from "./src/routes/ro.routes.js";
import salesRoute from "./src/routes/sales.routes.js";
import platformRoutes from "./src/routes/platform.route.js";
import clientRoutes from "./src/routes/client.routes.js";
import aggregatedDataRoutes from "./src/routes/aggregatedData.route.js";
import { verifyRole } from "./src/middleware/rbacMiddleware.js";
import { verifyToken } from "./src/middleware/jwtMiddleware.js";
import campaignMetricsRoutes from "./src/routes/campaignMetrics.route.js";
import clientNameRoutes from "./src/routes/clientName.route.js";
import releaseOrdersRoutes from "./src/routes/releaseOrders.routes.js";
import dspoutbrainRoutes from "./src/routes/dspoutbrain.route.js";
import { dirname } from "path";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Configure CORS
app.use(
  cors({
    origin: "insights.performacemedia.com", // Allow only this domain
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const port = process.env.PORT || 8000;
app.use(express.json());

app.use(express.static(path.join(__dirname, "Frontend")));
// JWT Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const login = await connectToMongo();
    const adminCollection = login.db("campaignAnalytics").collection("admin");
    const adminUser = await adminCollection.findOne({ email });

    if (adminUser) {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (isMatch) {
        const token = jwt.sign(
          { email: adminUser.email, role: adminUser.role },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.json({ token, role: adminUser.role });
      }
    }

    const authCollection = login.db("campaignAnalytics").collection("auth");
    const clientUser = await authCollection.findOne({ email });

    if (clientUser) {
      const isMatch = await bcrypt.compare(password, clientUser.password);
      if (isMatch) {
        const token = jwt.sign(
          { email: clientUser.email, role: clientUser.role },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.json({ token, role: clientUser.role });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Protected admin dashboard route
app.get("/admin", verifyToken, verifyRole("admin"), (req, res) => {
  res.send("Welcome to the admin dashboard");
});

// Initialize server and set up routes
(async () => {
  try {
    const mongoClient = await connectToMongo();
    const db = mongoClient.db("campaignAnalytics");

    // Check and initialize aggregatedTableFromAllPlatforms collection
    const collections = await db.listCollections().toArray();
    if (
      !collections.find((c) => c.name === "aggregatedTableFromAllPlatforms")
    ) {
      await db.createCollection("aggregatedTableFromAllPlatforms");
      console.log("Created aggregatedTableFromAllPlatforms collection");

      await db
        .collection("aggregatedTableFromAllPlatforms")
        .createIndexes([
          { key: { email: 1 } },
          { key: { startDate: 1 } },
          { key: { endDate: 1 } },
        ]);
      console.log("Created indexes for aggregatedTableFromAllPlatforms");
    }

    app.locals.db = db;

    // Set up routes
    app.use("/auth", authRoute);
    app.use("/admin", adminRoute);
    app.use("/sales", salesRoute);
    app.use("/api", mgidRoutes);
    app.use("/api", outbrainRoutes);
    app.use("/api", taboolaRoutes);
    app.use("/api", combinedMetricsRoutes);
    app.use("/api", emailRoutes);
    app.use("/api", roRoutes);
    app.use("/api", dspoutbrainRoutes);
    app.use("/api", clientNameRoutes);
    app.use("/api", platformRoutes);

    app.use("/api", clientRoutes);
    app.use("/api/aggregated", aggregatedDataRoutes);
    app.use("/api/metrics", campaignMetricsRoutes);
    // Add after other middleware setup
    app.use("/api/releaseOrders", releaseOrdersRoutes);

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
})();

export default app;
