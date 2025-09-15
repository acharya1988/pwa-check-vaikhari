import LayerModel from "../models/Layer.js";

export async function listLayers(userId: string, q?: string, type?: string) {
  const filter: any = { userId };
  if (type) filter.type = type;
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { text: { $regex: q, $options: 'i' } },
    { sourceTitle: { $regex: q, $options: 'i' } },
  ];
  return LayerModel.find(filter).sort({ updatedAt: -1 }).lean();
}

export async function createLayer(userId: string, body: any) {
  return LayerModel.create({ ...body, userId });
}

export async function getLayer(id: string) {
  return LayerModel.findById(id).lean();
}

export async function updateLayer(id: string, patch: any) {
  return LayerModel.findByIdAndUpdate(id, patch, { new: true }).lean();
}

export async function deleteLayer(id: string) {
  await LayerModel.findByIdAndDelete(id);
}

