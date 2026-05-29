import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);


const legacyItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },


    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
    },


    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },


    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "void"],
      default: "draft",
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },


    lineItems: {
      type: [lineItemSchema],
      required: true,
      default: [],
    },

    subtotal: {
      type: Number,
      required: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },


    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    sentAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },

    voidedAt: {
      type: Date,
    },

    notes: {
      type: String,
      default: "",
    },

    internalNotes: {
      type: String,
      default: "",
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },

    stripePaymentIntentId: {
      type: String,
      default: "",
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },


    total: {
      type: Number,
    },

    items: {
      type: [legacyItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


invoiceSchema.pre("validate", function () {

  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }


  if (this.clientId) {
    this.client = this.clientId;
  } else if (this.client) {
    this.clientId = this.client;
  }


  if (this.totalAmount !== undefined) {
    this.total = this.totalAmount;
  } else if (this.total !== undefined) {
    this.totalAmount = this.total;
  }


  if (this.lineItems && this.lineItems.length > 0 && (!this.items || this.items.length === 0)) {
    this.items = this.lineItems.map((item) => ({
      name: item.description,
      quantity: item.quantity,
      price: item.unitPrice,
    }));
  } else if (this.items && this.items.length > 0 && (!this.lineItems || this.lineItems.length === 0)) {
    this.lineItems = this.items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      amount: item.quantity * item.price,
    }));
  }
});

invoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ tenantId: 1, clientId: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;