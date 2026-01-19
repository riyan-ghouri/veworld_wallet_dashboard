// models/Note.js
import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    address: { type: String, required: true, trim: true }, // 🔗 wallet address link
    deleted: { type: Boolean, default: false }, // soft delete flag
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
