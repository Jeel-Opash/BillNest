import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/billnest";

async function runDiagnostics() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB at:", MONGO_URI);

    const user = await User.findOne({ email: "owner@acme-agency.com" });
    if (!user) {
      console.log("Error: User owner@acme-agency.com not found in database.");
      return;
    }

    console.log("\n--- User Database Record ---");
    console.log("ID:", user._id);
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Password Field (Raw Hash in DB):", user.password);
    console.log("PasswordHash Field (Raw Hash in DB):", user.passwordHash);

    const checkPassword = "Password123!";
    console.log("\n--- Bcrypt Password Hashing Tests ---");

    const matchPasswordDirect = await bcrypt.compare(checkPassword, user.password);
    console.log(`bcrypt.compare("${checkPassword}", user.password) ->`, matchPasswordDirect);

    const matchPasswordHash = await bcrypt.compare(checkPassword, user.passwordHash);
    console.log(`bcrypt.compare("${checkPassword}", user.passwordHash) ->`, matchPasswordHash);

  } catch (err) {
    console.error("Diagnostics script error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runDiagnostics();
