import BookProfile from "@/app/admin/books/books-public-view";
import { mongo } from "@/lib/mongo";
import LibraryItem from "@/models/LibraryItem";
import { getBook } from "@/services/book.service";

export default async function LibraryItemPage({ params }: { params: Promise<{ refId: string }> }) {
  const { refId } = await params;
  await mongo();

  let item: any = await LibraryItem.findOne({ refId }).lean().catch(() => null);
  if (!item) {
    try {
      const book = await getBook(refId);
      if (book) {
        item = {
          refId: book.id,
          refType: "Book",
          title: book.name,
          author: book.authorName,
          coverUrl: book.profileUrl,
          meta: { pages: (book as any).pages },
        };
      }
    } catch {}
  }

  const book = item
    ? {
        id: item.refId || refId,
        title: item.title || "",
        subtitle: "",
        coverUrl: item.coverUrl,
        description: "",
        contributors: item.author ? [{ id: item.author, name: item.author }] : [],
        sections: [],
        meta: { pages: item.meta?.pages },
        rating: 0,
        ratingCount: 0,
      }
    : undefined;

  return <BookProfile book={book} />;
}
