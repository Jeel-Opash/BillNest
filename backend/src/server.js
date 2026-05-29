import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { initScheduler } from "./utils/scheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  initScheduler();

  app.listen(PORT, () => {
    console.log(`BillNest SaaS Backend service active on port ${PORT}`);
  });
};

startServer();
