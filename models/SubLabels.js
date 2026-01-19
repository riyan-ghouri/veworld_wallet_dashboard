import mongoose from "mongoose";

const SubLabelSchema = new mongoose.Schema(
  {
    sublabel: {
      type: String,
      required: true,
      trim: true,
    },
    labelname: {
      type: String, // storing the label's name directly
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SubLabel || mongoose.model("SubLabel", SubLabelSchema);
