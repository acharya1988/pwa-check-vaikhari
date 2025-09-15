import { Response } from "express";
export const ok = <T>(res: Response, data: T, message = "OK") =>
  res.json({ success: true, data, message });
export const fail = (res: Response, message = "Error", code = 400, error?: any) =>
  res.status(code).json({ success: false, message, error });

