export const ok = (res, data, message = "OK") => res.json({ success: true, data, message });
export const fail = (res, message = "Error", code = 400, error) => res.status(code).json({ success: false, message, error });
