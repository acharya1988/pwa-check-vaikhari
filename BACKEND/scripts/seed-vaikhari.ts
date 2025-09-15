import "dotenv/config";
import { mongo } from "@/lib/mongo";
import Drift from "@/models/Drift";
import Layer from "@/models/Layer";
import LibraryItem from "@/models/LibraryItem";

async function main() {
  await mongo();

  const userId = process.env.SEED_USER_ID || "demo-user";

  await Drift.updateOne(
    { userId, title: "Circadian Dinacharya & Agni Windows" },
    {
      $setOnInsert: {
        userId,
        title: "Circadian Dinacharya & Agni Windows",
        sourceType: "Book",
        sourceId: "ashtanga-hridaya",
        sourceTitle: "Aṣṭāṅga Hṛdaya – Sūtrasthāna",
        sourceAuthor: "Vāgbhaṭa",
        sourceRef: "Sutra 2",
        sourceAnchor: "sutra-2",
        excerpt: "कालानुगुणं…",
        content: "Draft thoughts on agni windows.",
        tags: ["Dinacharya", "Agni"],
        words: 120,
        status: "draft",
      },
    },
    { upsert: true }
  );

  await Layer.updateOne(
    { userId, title: "On Hita-Ahita framing" },
    {
      $setOnInsert: {
        userId,
        title: "On Hita-Ahita framing",
        type: "Commentary",
        sourceType: "Book",
        sourceId: "ashtanga-hridaya",
        sourceTitle: "Aṣṭāṅga Hṛdaya – Sūtrasthāna",
        sourceAuthor: "Vāgbhaṭa",
        sourceRef: "1.8",
        anchor: "sutra-1-8",
        text: "‘Hita’ is context-conditioned…",
        tags: ["Sutra", "Dinacharya"],
        pinned: true,
      },
    },
    { upsert: true }
  );

  await LibraryItem.updateOne(
    { userId, refId: "ashtanga-hridaya" },
    {
      $setOnInsert: {
        userId,
        refId: "ashtanga-hridaya",
        refType: "Book",
        title: "Aṣṭāṅga Hṛdaya",
        author: "Vāgbhaṭa",
        coverUrl: "/covers/ashtanga-hridaya.jpg",
        meta: { pages: 624 },
      },
    },
    { upsert: true }
  );

  console.log("Seed OK");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

