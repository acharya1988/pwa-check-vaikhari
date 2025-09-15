import { Schema, model, models } from "mongoose";

const LayerSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    title: String,
    type: { type: String, enum: ["Commentary", "Explanation", "Translation", "Cross-ref"], default: "Commentary", index: true },
    sourceType: { type: String, enum: ["Book", "Article", "White Paper", "Abstract"], default: "Book" },
    sourceId: String,
    sourceTitle: String,
    sourceAuthor: String,
    sourceRef: String,
    sourceCover: String,
    anchor: String,
    text: String,
    tags: [String],
    pinned: Boolean,
  },
  { timestamps: true }
);

export default (models as any).Layer || model("Layer", LayerSchema);

