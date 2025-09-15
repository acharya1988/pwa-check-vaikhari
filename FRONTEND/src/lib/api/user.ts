import { NextRequest } from "next/server";
import { verifyRequestAndGetUser } from "@/lib/auth";

export async function getUserId(req?: NextRequest) {
  try {
    const res = await verifyRequestAndGetUser();
    if ((res as any).ok) {
      return (res as any).user?._id || (res as any).user?.id || (res as any).user?.email || "demo-user";
    }
  } catch {
    // ignore
  }
  return process.env.SEED_USER_ID || "demo-user";
}

