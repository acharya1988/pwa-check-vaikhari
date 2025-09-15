import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const LibraryItemSchema = new Schema({
    userId: { type: String, index: true, required: true },
    refId: { type: String, index: true, required: true },
    refType: { type: String, enum: ["Book", "Article", "White Paper", "Abstract"], required: true },
    title: String,
    author: String,
    coverUrl: String,
    meta: Schema.Types.Mixed,
}, { timestamps: true });
LibraryItemSchema.index({ userId: 1, refId: 1 }, { unique: true });
export default models.LibraryItem || model("LibraryItem", LibraryItemSchema);
