import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { connectDb, ensureIndexes } from "./config/db.js";
import { errorHandler } from "./middlewares/error.js";

export async function makeApp() {
  await connectDb();
  try { await ensureIndexes(); } catch {}
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*", credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("tiny"));
  app.use("/api", routes);
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}
