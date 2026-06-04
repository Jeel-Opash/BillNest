import cron from "node-cron";
import Invoice from "../models/invoice.model.js";
import SubscriptionService from "../services/subscription.service.js";

export const initScheduler = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await Invoice.updateMany(
        { status: "sent", dueDate: { $lt: new Date() } },
        { $set: { status: "overdue" } }
      );
      if (result.modifiedCount > 0) {
        process.stdout.write(`[Scheduler] Marked ${result.modifiedCount} invoices overdue\n`);
      }
    } catch (_) {}
  });

  cron.schedule("0 1 * * *", async () => {
    try {
      await SubscriptionService.runDunningScheduler();
    } catch (_) {}
  });

  cron.schedule("0 2 * * *", async () => {
    try {
      const count = await SubscriptionService.runAutoInvoicing();
      if (count > 0) {
        process.stdout.write(`[Scheduler] Auto-invoiced ${count} subscriptions\n`);
      }
    } catch (_) {}
  });
};
