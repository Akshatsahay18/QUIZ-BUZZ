import "dotenv/config";
import mongoose from "mongoose";

const main = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not set in environment.");
      process.exit(1);
    }

    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(uri, { connectTimeoutMS: 10000 });
    console.log("MongoDB connection successful.");
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

main();
