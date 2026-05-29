import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zip: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    taxId: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },

    billingAddress: {
      type: addressSchema,
      required: true,
      default: () => ({}),
    },

    shippingAddress: {
      type: addressSchema,
      default: () => ({}),
    },

    contactPerson: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    stripeCustomerId: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },


    address: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


clientSchema.pre("validate", function () {

  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }


  if (this.address && (!this.billingAddress || !this.billingAddress.street)) {
    this.billingAddress = {
      street: this.address,
      city: "",
      state: "",
      zip: "",
      country: "",
    };
  } else if (this.billingAddress && this.billingAddress.street && !this.address) {
    this.address = [
      this.billingAddress.street,
      this.billingAddress.city,
      this.billingAddress.state,
      this.billingAddress.country,
    ]
      .filter(Boolean)
      .join(", ");
  }


  if (this.company && !this.contactPerson) {
    this.contactPerson = this.company;
  } else if (this.contactPerson && !this.company) {
    this.company = this.contactPerson;
  }
});

clientSchema.index({ tenantId: 1, isActive: 1 });
clientSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
