import cron from "node-cron";
import Invoice from "../models/invoice.model.js";
import SubscriptionService from "../services/subscription.service.js";


export const initScheduler = () => {
  console.log("Scheduler: Initializing background cron jobs...");

  cron.schedule("0 0 * * *", async () => {
    console.log("Scheduler Job: Checking for invoices that passed their due date...");
    try {
      const today = new Date();

      const result = await Invoice.updateMany(
        {
          status: "sent",
          dueDate: { $lt: today },
        },
        {
          $set: { status: "overdue" },
        }
      );

      console.log(`Scheduler Job: Transitioned ${result.modifiedCount} invoices to 'overdue' status.`);
    } catch (error) {
      console.error("Scheduler Job Error (invoice due-check):", error);
    }
  });

  cron.schedule("0 1 * * *", async () => {
    console.log("Scheduler Job: Launching automatic dunning reminders...");
    try {
      await SubscriptionService.runDunningScheduler();
    } catch (error) {
      console.error("Scheduler Job Error (dunning run):", error);
    }
  });

  cron.schedule("0 2 * * *", async () => {
    console.log("Scheduler Job: Checking subscriptions for auto-invoicing renewals...");
    try {
      await SubscriptionService.runAutoInvoicing();
    } catch (error) {
      console.error("Scheduler Job Error (auto-invoicing run):", error);
    }
  });
};
