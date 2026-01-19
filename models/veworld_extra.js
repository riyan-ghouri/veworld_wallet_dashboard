import mongoose from "mongoose";

const VeworldExtraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    stakedAccount: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.veworld_extra ||
  mongoose.model("veworld_extra", VeworldExtraSchema);
