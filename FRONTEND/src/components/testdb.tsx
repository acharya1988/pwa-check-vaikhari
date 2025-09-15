"use client";

import { useState } from "react";
import { testDbConnection, inspectDb } from "@/actions/test.action";

export function TestDbButton() {
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<any>(null);

  const handleTestDb = async () => {
    setLoading(true);
    try {
      const conn = await testDbConnection();
      const snap = await inspectDb(3);
      setLast({ conn, snap });
      console.log("DB connection:", conn);
      console.log("Mongo snapshot:", snap);
    } catch (err) {
      console.error("Error while testing DB:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTestDb}
      disabled={loading}
      title={last ? JSON.stringify(last).slice(0, 600) : "Test DB"}
      className="w-[200px] h-[200px] text-2xl font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 shadow-2xl z-[9999] flex items-center justify-center"
    >
      {loading ? "Testing..." : "Test DB"}
    </button>
  );
}

