import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 5, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections to maintain
  maxIdleTimeMS: 30000, // How long a connection can remain idle before being removed
  connectTimeoutMS: 30000, // How long to wait for a connection to be established
};

let client = null;
let clientPromise = null;

export async function connectToMongo() {
  if (client) {
    return client;
  }

  try {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    await clientPromise;
    console.log("Connected to MongoDB");
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Use this function for one-time operations
export async function getDb(dbName = "campaignAnalytics") {
  const client = await connectToMongo();
  return client.db(dbName);
}

// Handle application shutdown - proper connection cleanup
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
});
