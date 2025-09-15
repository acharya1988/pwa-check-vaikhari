import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const LayerSchema = new Schema({
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
}, { timestamps: true });
export default models.Layer || model("Layer", LayerSchema);
