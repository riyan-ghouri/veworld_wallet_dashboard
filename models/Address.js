import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // ✅ Always store in lowercase
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    sublabel: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null, // ✅ optional field
    },
    notification: {
      type: Boolean,
      default: false, // ✅ enabled by default
    },
    deleted: {
      type: Boolean,
      default: false, // soft delete flag
    },
  },
  {
    timestamps: true,
    collection: "wallet_address",
  }
);

// ✅ Ensure address and email are lowercase before saving
WalletSchema.pre("save", function (next) {
  if (this.address) this.address = this.address.toLowerCase();
  if (this.email) this.email = this.email.toLowerCase();
  next();
});

export default mongoose.models.WalletAddress ||
  mongoose.model("WalletAddress", WalletSchema, "wallet_address");
