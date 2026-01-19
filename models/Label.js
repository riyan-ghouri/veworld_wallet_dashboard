import mongoose from "mongoose";

const LabelSchema = new mongoose.Schema(
  {
    labelname: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Label || mongoose.model("Label", LabelSchema);
