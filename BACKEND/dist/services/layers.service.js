import LayerModel from "../models/Layer.js";
export async function listLayers(userId, q, type) {
    const filter = { userId };
    if (type)
        filter.type = type;
    if (q)
        filter.$or = [
            { title: { $regex: q, $options: 'i' } },
            { text: { $regex: q, $options: 'i' } },
            { sourceTitle: { $regex: q, $options: 'i' } },
        ];
    return LayerModel.find(filter).sort({ updatedAt: -1 }).lean();
}
export async function createLayer(userId, body) {
    return LayerModel.create({ ...body, userId });
}
export async function getLayer(id) {
    return LayerModel.findById(id).lean();
}
export async function updateLayer(id, patch) {
    return LayerModel.findByIdAndUpdate(id, patch, { new: true }).lean();
}
export async function deleteLayer(id) {
    await LayerModel.findByIdAndDelete(id);
}
