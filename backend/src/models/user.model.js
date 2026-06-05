import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
    },


    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },


    passwordHash: {
      type: String,
      required: true,
    },


    password: {
      type: String,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member", "read_only", "read-only"],
      default: "member",
    },

    clientAccess: [
      {
        clientId: { type: String },
        clientName: { type: String },
        role: { type: String, enum: ["admin", "member", "viewer", "none"], default: "none" }
      }
    ],

    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "invited",
    },

    inviteToken: {
      type: String,
    },

    inviteExpiry: {
      type: Date,
    },


    lastLoginAt: {
      type: Date,
    },


    lastLogin: {
      type: Date,
    },


    refreshTokenHash: {
      type: String,
    },


    refreshTokens: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre("validate", function () {

  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }


  if (this.passwordHash) {
    this.password = this.passwordHash;
  } else if (this.password) {
    this.passwordHash = this.password;
  }


  if (this.lastLoginAt) {
    this.lastLogin = this.lastLoginAt;
  } else if (this.lastLogin) {
    this.lastLoginAt = this.lastLogin;
  }
});


userSchema.pre("save", function () {
  if (this.role === "read-only") {
    this.role = "read_only";
  }
});

userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ inviteToken: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;