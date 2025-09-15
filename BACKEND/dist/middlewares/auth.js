import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}
