const mongoose = require("mongoose");

const botSchema = new mongoose.Schema(
  {
    name: String,
    index: Number,
    address: String,
    claim: {
      type: Boolean,
      default: false,
    },
    lastG:{
      type: Number,
      default: 0,
    },
    lastClaimAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ FIX HERE
module.exports =
  mongoose.models.BOT || mongoose.model("BOT", botSchema);