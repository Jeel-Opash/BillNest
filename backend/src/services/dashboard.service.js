import mongoose from "mongoose";
import Invoice from "../models/invoice.model.js";
import Client from "../models/client.model.js";

class DashboardService {

  async getStats(organizationId) {
    const orgId = new mongoose.Types.ObjectId(organizationId);


    const outstandingPipeline = [
      { $match: { organization: orgId } },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ];

    const invoiceStats = await Invoice.aggregate(outstandingPipeline);

    let totalRevenue = 0;
    let outstandingRevenue = 0;
    let totalInvoicesCount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoiceStats.forEach((group) => {
      totalInvoicesCount += group.count;
      if (group._id === "paid") {
        totalRevenue = group.totalAmount;
        paidCount = group.count;
      } else if (group._id === "sent" || group._id === "overdue") {
        outstandingRevenue += group.totalAmount;
        pendingCount += group.count;
      }
    });


    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const mrrPipeline = [
      {
        $match: {
          organization: orgId,
          status: "paid",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          mrr: { $sum: "$total" },
        },
      },
    ];

    const mrrResult = await Invoice.aggregate(mrrPipeline);
    const mrr = mrrResult.length > 0 ? mrrResult[0].mrr : 0;


    const topClientsPipeline = [
      { $match: { organization: orgId } },
      {
        $group: {
          _id: "$client",
          totalSpent: { $sum: "$total" },
          invoicesCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },

      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      { $unwind: "$clientDetails" },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          invoicesCount: 1,
          name: "$clientDetails.name",
          email: "$clientDetails.email",
          company: "$clientDetails.company",
        },
      },
    ];

    const topClients = await Invoice.aggregate(topClientsPipeline);


    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrendPipeline = [
      {
        $match: {
          organization: orgId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          billed: { $sum: "$total" },
          collected: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$total", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ];

    const rawTrend = await Invoice.aggregate(monthlyTrendPipeline);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = rawTrend.map((t) => ({
      month: `${monthNames[t._id.month - 1]} ${t._id.year}`,
      billed: t.billed,
      collected: t.collected,
    }));


    const totalClientsCount = await Client.countDocuments({ organization: orgId, isActive: true });

    return {
      mrr,
      totalRevenue,
      outstandingRevenue,
      totalClientsCount,
      totalInvoicesCount,
      paidCount,
      pendingCount,
      topClients,
      monthlyTrend,
    };
  }
}

export default new DashboardService();
