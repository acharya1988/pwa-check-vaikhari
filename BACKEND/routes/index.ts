import { Router } from "express";
import drifts from "./drifts.route.js";
import layers from "./layers.route.js";
import library from "./library.route.js";
import profile from "./profile.route.js";
import session from "./session.route.js";

const r = Router();
r.use("/v1/drifts", drifts);
r.use("/v1/layers", layers);
r.use("/v1/library", library);
r.use("/v1/profile", profile);
r.use("/v1/session", session);
export default r;
