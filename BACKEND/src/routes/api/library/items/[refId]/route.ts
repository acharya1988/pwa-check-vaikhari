import { NextRequest, NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import LibraryItem from "@/models/LibraryItem";
import { getBook } from "@/services/book.service";

export async function GET(_req: NextRequest, { params }: { params: { refId: string } }) {
  await mongo();
  const refId = params.refId;
  const lib = await LibraryItem.findOne({ refId }).lean();
  if (lib) return NextResponse.json({ item: lib });

  // Fallback to catalog/book service
  try {
    const book = await getBook(refId);
    if (book) {
      return NextResponse.json({ item: {
        refId: book.id,
        refType: "Book",
        title: book.name,
        author: book.authorName,
        coverUrl: book.profileUrl,
        meta: { pages: (book as any).pages }
      }});
    }
  } catch {}
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

