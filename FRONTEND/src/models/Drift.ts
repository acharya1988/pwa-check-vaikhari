import { Schema, model, models } from "mongoose";

const DriftSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    title: String,
    sourceType: { type: String, enum: ["Book", "Article", "White Paper", "Abstract"], default: "Book" },
    sourceId: String,
    sourceTitle: String,
    sourceAuthor: String,
    sourceRef: String,
    sourceAnchor: String,
    excerpt: String,
    content: String,
    tags: [String],
    words: Number,
    goal: Number,
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  },
  { timestamps: true }
);

export default (models as any).Drift || model("Drift", DriftSchema);

