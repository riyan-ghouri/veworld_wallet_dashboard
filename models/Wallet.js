import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    mnemonic: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "", // optional, user can set later
      trim: true,
    },
    deleted: {
      type: Boolean,
      default: false, // soft delete flag
    },
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);
