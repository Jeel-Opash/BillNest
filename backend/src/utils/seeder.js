import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/billnext";

const seedDatabase = async () => {
  try {
    console.log("Seeder: Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Seeder: Connected to database. Purging old records...");

    await User.deleteMany();
    await Organization.deleteMany();
    await Client.deleteMany();
    await Invoice.deleteMany();

    console.log("Seeder: Collections purged successfully. Creating organization...");

    const organization = await Organization.create({
      name: "PixelFlow Digital Agency",
      slug: "pixelflow",
      subscription: {
        plan: "pro",
        status: "active",
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("Seeder: Organization 'PixelFlow Digital' created. Creating owner account...");

    const hashedPassword = await bcrypt.hash("password123", 10);
    const owner = await User.create({
      organization: organization._id,
      name: "Alex Reed",
      email: "alex@pixelflow.com",
      password: hashedPassword,
      role: "owner",
    });

    organization.owner = owner._id;
    await organization.save();

    console.log("Seeder: Owner created. Creating isolated clients...");

    const client1 = await Client.create({
      organization: organization._id,
      name: "Jonathan Vance",
      email: "billing@vanceinc.com",
      company: "Vance Technologies Inc.",
      phone: "+1 555-019-2834",
      taxId: "TX-9938210",
      address: "402 Silicon Valley Blvd, San Jose, CA",
      currency: "USD",
    });

    const client2 = await Client.create({
      organization: organization._id,
      name: "Amara Okoye",
      email: "finance@nigeriabrand.ng",
      company: "Amara Creative Labs Ltd",
      phone: "+234 803 123 4567",
      taxId: "NG-483019",
      address: "12 Marina Dr, Lagos Island, Lagos",
      currency: "USD",
    });

    console.log("Seeder: Clients created successfully. Building invoice collection...");

  
    await Invoice.create({
      organization: organization._id,
      client: client1._id,
      invoiceNumber: "INV-2026-001",
      items: [
        { name: "Full-Stack Web App Development", quantity: 1, price: 4500 },
        { name: "UI/UX Consultation Workshop", quantity: 3, price: 150 },
      ],
      subtotal: 4950,
      taxRate: 8,
      taxAmount: 396,
      discountRate: 5, 
      discountAmount: 247.5,
      total: 5098.5,
      status: "draft",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    await Invoice.create({
      organization: organization._id,
      client: client2._id,
      invoiceNumber: "INV-2026-002",
      items: [
        { name: "SaaS API Dashboard Development", quantity: 1, price: 3200 },
      ],
      subtotal: 3200,
      taxRate: 5,
      taxAmount: 160,
      discountRate: 0,
      discountAmount: 0,
      total: 3360,
      status: "sent",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await Invoice.create({
      organization: organization._id,
      client: client1._id,
      invoiceNumber: "INV-2026-003",
      items: [
        { name: "Cloud Server Deployment & DevOps setup", quantity: 2, price: 600 },
      ],
      subtotal: 1200,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 10,
      discountAmount: 120,
      total: 1080,
      status: "paid",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    await Invoice.create({
      organization: organization._id,
      client: client2._id,
      invoiceNumber: "INV-2026-004",
      items: [
        { name: "Monthly SEO Maintenance retainer", quantity: 1, price: 850 },
      ],
      subtotal: 850,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      total: 850,
      status: "overdue",
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    console.log("-----------------------------------------");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("-----------------------------------------");
    console.log("Primary Owner Login Credentials:");
    console.log("Email: alex@pixelflow.com");
    console.log("Password: password123");
    console.log("-----------------------------------------");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
};

seedDatabase();
