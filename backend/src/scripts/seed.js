import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";

import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import Subscription from "../models/subscription.model.js";
import AuditLog from "../models/auditLog.model.js";
import ApiKey from "../models/apiKey.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/billnest";
const passwordHash = await bcrypt.hash("Password123!", 12);

const hashKey = (value) => crypto.createHash("sha256").update(value).digest("hex");

const upsertUser = (org, role) =>
  User.findOneAndUpdate(
    { organization: org._id, email: `${role}@${org.slug}.com` },
    {
      $set: {
        tenantId: org._id,
        organization: org._id,
        name: `${role[0].toUpperCase()}${role.slice(1)} User`,
        passwordHash,
        password: passwordHash,
        role,
        status: "active",
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const seedTenant = async ({ name, slug, plan, clients, planDefs, invoiceCount, subscriptionCount, auditCount = 0, apiKeyCount = 0 }) => {
  const org = await Organization.findOneAndUpdate(
    { slug },
    {
      $set: {
        name,
        slug,
        plan,
        currency: "USD",
        settings: { invoicePrefix: slug === "acme-agency" ? "ACME" : "BETA", locale: "en-US", timezone: "UTC", darkMode: false },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const owner = await upsertUser(org, "owner");
  await upsertUser(org, "admin");
  await upsertUser(org, "member");
  org.owner = owner._id;
  org.ownerUserId = owner._id;
  org.userId = owner._id;
  await org.save();

  const createdClients = [];
  for (const [index, client] of clients.entries()) {
    const doc = await Client.findOneAndUpdate(
      { organization: org._id, email: client.email },
      { $set: { tenantId: org._id, organization: org._id, ...client, isActive: true, createdBy: owner._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdClients.push(doc);
  }

  const createdPlans = [];
  for (const def of planDefs) {
    const doc = await SubscriptionPlan.findOneAndUpdate(
      { organization: org._id, name: def.name },
      { $set: { tenantId: org._id, organization: org._id, ...def, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdPlans.push(doc);
  }

  const statuses = ["draft", "sent", "paid", "overdue", "void"];
  for (let i = 0; i < invoiceCount; i++) {
    const client = createdClients[i % createdClients.length];
    const status = slug === "acme-agency"
      ? [...Array(4).fill("draft"), ...Array(4).fill("sent"), ...Array(4).fill("paid"), ...Array(2).fill("overdue"), "void"][i]
      : statuses[i % statuses.length];
    const totalAmount = 500 + i * 125;
    await Invoice.findOneAndUpdate(
      { organization: org._id, invoiceNumber: `${org.settings.invoicePrefix}-2026-${String(i + 1).padStart(4, "0")}` },
      {
        $set: {
          tenantId: org._id,
          organization: org._id,
          client: client._id,
          clientId: client._id,
          status,
          currency: client.currency,
          lineItems: [{ description: "SaaS billing services", quantity: 1, unitPrice: totalAmount, amount: totalAmount }],
          items: [{ name: "SaaS billing services", quantity: 1, price: totalAmount }],
          subtotal: totalAmount,
          taxRate: 10,
          taxAmount: totalAmount * 0.1,
          discountAmount: 0,
          totalAmount: totalAmount * 1.1,
          total: totalAmount * 1.1,
          dueDate: new Date(Date.now() + (i - 5) * 86400000),
          sentAt: ["sent", "paid", "overdue", "void"].includes(status) ? new Date() : undefined,
          paidAt: status === "paid" ? new Date() : undefined,
          voidedAt: status === "void" ? new Date() : undefined,
          createdBy: owner._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (let i = 0; i < subscriptionCount; i++) {
    const client = createdClients[i % createdClients.length];
    const subPlan = createdPlans[i % createdPlans.length];
    await Subscription.findOneAndUpdate(
      { organization: org._id, client: client._id, planId: subPlan._id },
      {
        $set: {
          tenantId: org._id,
          organization: org._id,
          client: client._id,
          clientId: client._id,
          planId: subPlan._id,
          planName: subPlan.name,
          amount: subPlan.price,
          currency: subPlan.currency,
          billingCycle: subPlan.billingCycle,
          status: "active",
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 86400000),
          nextInvoiceDate: new Date(Date.now() + 30 * 86400000),
          lineItems: [{ description: subPlan.name, quantity: 1, unitPrice: subPlan.price, amount: subPlan.price }],
          createdBy: owner._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (let i = 0; i < auditCount; i++) {
    const exists = await AuditLog.exists({ organization: org._id, action: `seed_action_${i}` });
    if (!exists) {
      await AuditLog.create({
        tenantId: org._id,
        organization: org._id,
        userId: owner._id,
        user: owner._id,
        userEmail: owner.email,
        action: `seed_action_${i}`,
        resourceType: "seed",
        resourceId: org._id,
        details: { index: i },
      });
    }
  }

  for (let i = 0; i < apiKeyCount; i++) {
    const plain = `saas_${slug}_${crypto.randomBytes(24).toString("base64url").slice(0, 32)}`;
    const keyHash = hashKey(plain);
    await ApiKey.findOneAndUpdate(
      { organization: org._id, name: `Seed key ${i + 1}` },
      { $set: { tenantId: org._id, organization: org._id, name: `Seed key ${i + 1}`, key: keyHash, keyHash, last4: plain.slice(-4), isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return { org, users: 3, clients: createdClients.length, plans: createdPlans.length, invoices: invoiceCount, subscriptions: subscriptionCount };
};

try {
  await mongoose.connect(MONGO_URI);

  const acme = await seedTenant({
    name: "Acme Agency",
    slug: "acme-agency",
    plan: "pro",
    clients: [
      { name: "Maya Patel", company: "Northstar Labs", email: "billing@northstar.test", currency: "USD" },
      { name: "Leo Martin", company: "Urban Ledger", email: "finance@urbanledger.test", currency: "EUR" },
      { name: "Ananya Rao", company: "Kirana Cloud", email: "accounts@kiranacloud.test", currency: "INR" },
      { name: "Olivia Shaw", company: "Harbor Studio", email: "ops@harborstudio.test", currency: "GBP" },
      { name: "Noah Brooks", company: "Outback Apps", email: "billing@outbackapps.test", currency: "AUD" },
    ],
    planDefs: [
      { name: "Starter", price: 49, currency: "USD", billingCycle: "monthly", features: ["Invoices", "Client portal"] },
      { name: "Growth", price: 149, currency: "USD", billingCycle: "monthly", features: ["Subscriptions", "Reports"] },
      { name: "Enterprise", price: 499, currency: "USD", billingCycle: "monthly", features: ["API keys", "Priority support"] },
    ],
    invoiceCount: 15,
    subscriptionCount: 3,
    auditCount: 30,
    apiKeyCount: 2,
  });

  const beta = await seedTenant({
    name: "Beta Studio",
    slug: "beta-studio",
    plan: "starter",
    clients: [
      { name: "Evan King", company: "Launch Box", email: "billing@launchbox.test", currency: "USD" },
      { name: "Isha Sen", company: "Muse Works", email: "finance@museworks.test", currency: "INR" },
      { name: "Grace Lin", company: "Paper Trail", email: "accounts@papertrail.test", currency: "EUR" },
    ],
    planDefs: [
      { name: "Studio", price: 79, currency: "USD", billingCycle: "monthly", features: ["Invoices", "Subscriptions"] },
      { name: "Studio Annual", price: 799, currency: "USD", billingCycle: "yearly", features: ["Annual billing", "Reports"] },
    ],
    invoiceCount: 8,
    subscriptionCount: 2,
  });

  const codenova = await seedTenant({
    name: "Codenova",
    slug: "org_codenova",
    plan: "pro",
    clients: [
      { name: "Sara Connor", company: "Cyberdyne Systems", email: "finance@cyberdyne.test", currency: "USD" },
      { name: "John Connor", company: "Resistance Tech", email: "tech@resistance.test", currency: "USD" },
    ],
    planDefs: [
      { name: "Basic", price: 29, currency: "USD", billingCycle: "monthly", features: ["Invoices"] },
      { name: "Advanced", price: 99, currency: "USD", billingCycle: "monthly", features: ["Invoices", "Subscriptions"] },
    ],
    invoiceCount: 5,
    subscriptionCount: 1,
    auditCount: 10,
    apiKeyCount: 1,
  });

  console.log(`Seeded: 3 tenants, ${acme.users + beta.users + codenova.users} users, ${acme.clients + beta.clients + codenova.clients} clients, ${acme.plans + beta.plans + codenova.plans} plans, ${acme.invoices + beta.invoices + codenova.invoices} invoices, ${acme.subscriptions + beta.subscriptions + codenova.subscriptions} subscriptions`);
  console.log("Logins:");
  console.log(" - Tenant 1 (Acme Agency): owner@acme-agency.com / Password123!");
  console.log(" - Tenant 2 (Beta Studio): owner@beta-studio.com / Password123!");
  console.log(" - Tenant 3 (Codenova): owner@org_codenova.com / Password123!");
  await mongoose.disconnect();
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
