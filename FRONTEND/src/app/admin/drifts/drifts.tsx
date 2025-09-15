'use client';

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, BookOpen, Layers, MoreHorizontal, Eye, Link2, Trash2, Tag, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDrifts } from "@/hooks/useDrifts";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// -------------------------------------------------
// Types
// -------------------------------------------------

type LayerStatus = "draft" | "published" | "archived";

type Layer = {
  id: string;
  title: string; // commentary/explanation title
  sourceTitle: string; // e.g., AsÌ£tÌ£aÌ„nÌ£ga HrÌ£daya â€“ SutrasthÄna
  sourceAuthor?: string;
  sourceRef?: string; // e.g., Sutra 1.12 or section id
  excerpt: string; // original paragraph where commentary was written
  content: string; // user commentary
  tags?: string[];
  status: LayerStatus;
  updatedAt: string; // e.g., "2h"\n  bookId?: string; // to open Living Document
};

// -------------------------------------------------
// Sample Data
// -------------------------------------------------

const myLayersSeed: Layer[] = [
  {
    id: "l1",
    title: "Agni at Dawn",
    sourceTitle: "Aá¹£á¹­Äá¹…ga Há¹›daya â€“ SÅ«trasthÄna",
    sourceAuthor: "VÄgbhaá¹­a",
    sourceRef: "Sutra 2",
    excerpt: "à¤•à¤¾à¤²à¤¾à¤¨à¥à¤—à¥à¤£à¤‚ à¤¹à¤¿ à¤†à¤¹à¤¾à¤°à¤¾-à¤µà¤¿à¤¹à¤¾à¤°à¤¯à¥‹à¤°à¥â€¦",
    content:
      "Here I elaborate on how early morning agni relates to circadian biorhythms and the praká¹›ti of the patient.",
    tags: ["Agni", "Dinacharya"],
    status: "draft",
    updatedAt: "3h",
  },
  {
    id: "l2",
    title: "Doá¹£a Balance vs. Praká¹›ti Bias",
    sourceTitle: "Clinical Abstract â€“ Doá¹£a Theory",
    sourceAuthor: "Kalpatantra Gurukula",
    sourceRef: "Â§4.1",
    excerpt: "Is tridoá¹£a sama truly baseline health, or should praká¹›tiâ€‘specific bias be treated as normal?",
    content:
      "My view: praká¹›ti biases are not pathologies but baselines. Commentary ties this to Charaka Saá¹ƒhitÄâ€™s perspectives.",
    tags: ["Doá¹£a", "Praká¹›ti"],
    status: "published",
    updatedAt: "1d",
  },
];

// -------------------------------------------------
// UI Blocks
// -------------------------------------------------

function PageHeader({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-screen-sm px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-xl">My Layers</div>
          <Badge variant="secondary" className="rounded-full">Commentary</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-9 w-9"><Search className="h-5 w-5"/></Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="h-9 w-9"><Plus className="h-5 w-5"/></Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Start a new Layer</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <QuickAction icon={<Layers className="h-5 w-5"/>} title="Blank layer"/>
                  <QuickAction icon={<BookOpen className="h-5 w-5"/>} title="From paragraph"/>
                </div>
                <SheetFooter className="mt-4">
                  <Button className="w-full rounded-full">Open Composer</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Search your layersâ€¦"
            className="h-10 rounded-xl"
            onKeyDown={(e) => { if (e.key === "Enter") onSearch((e.target as HTMLInputElement).value); }}
          />
          <FiltersButton />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Button variant="outline" className="h-16 rounded-xl justify-start gap-3">
      {icon}
      <span className="font-medium">{title}</span>
    </Button>
  );
}

function FiltersButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-xl whitespace-nowrap"><Filter className="mr-2 h-4 w-4"/> Filters <ChevronDown className="ml-1 h-4 w-4"/></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>Recent</DropdownMenuItem>
        <DropdownMenuItem>Oldest</DropdownMenuItem>
        <DropdownMenuItem>Drafts</DropdownMenuItem>
        <DropdownMenuItem>Published</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LayerCard({ l }: { l: Layer }) {
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
            <Layers className="h-5 w-5 text-muted-foreground"/>
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 text-base leading-snug">{l.title}</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              From <span className="font-medium">{l.sourceTitle}</span>{l.sourceAuthor ? ` Â· ${l.sourceAuthor}` : ""}{l.sourceRef ? ` Â· ${l.sourceRef}` : ""}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem><Eye className="mr-2 h-4 w-4"/> View Layer</DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{l.title}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 text-sm">
                    <p className="mb-3 text-muted-foreground">Excerpt: â€œ{l.excerpt}â€</p>
                    <p>{l.content}</p>
                  </div>
                    <div className="mt-3 flex justify-end gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={l.bookId ? `/admin/living-document?bookId=${l.bookId}` : '#'}>
                        <Link2 className="mr-1 h-4 w-4"/> Go to Book
                      </a>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <blockquote className="rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          â€œ{l.excerpt}â€
        </blockquote>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/> Updated {l.updatedAt}</div>
          {l.tags && (
            <div className="inline-flex items-center gap-2">
              <Tag className="h-3.5 w-3.5"/>
              <div className="truncate">{l.tags.join(", ")}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-screen-sm rounded-2xl border p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
        <Layers className="h-5 w-5 text-muted-foreground"/>
      </div>
      <div className="text-lg font-semibold">No layers yet</div>
      <p className="mt-1 text-sm text-muted-foreground">Write your own commentary or explanation and layer it on top of passages.</p>
      <Button className="mt-4 rounded-full">Create your first layer</Button>
    </div>
  );
}

// -------------------------------------------------
// Main Page
// -------------------------------------------------

export default function MyLayersPage() {
  const [tab, setTab] = useState<"all" | "drafts" | "published">("all");
  const [q, setQ] = useState("");
  const { drifts: liveDrifts } = useDrifts(q, tab === "drafts" ? "draft" : tab === "published" ? "published" : undefined);
  // Map drifts -> UI Layer shape; keep seed as fallback to avoid layout jump
  const liveLayers: Layer[] = (liveDrifts || []).map((d: any) => ({
    id: d._id?.toString?.() || d.id,
    title: d.title,
    sourceTitle: d.sourceTitle,
    sourceAuthor: d.sourceAuthor,
    sourceRef: d.sourceRef,
    excerpt: d.excerpt || d.content || "",
    content: d.content || "",
    tags: d.tags || [],
    status: d.status || "draft",
    updatedAt: d.updatedAt ? timeAgo(new Date(d.updatedAt)) : "",
    bookId: d.sourceId || d.bookId,
  }));
  const [myLayers] = useState<Layer[]>(liveLayers.length ? liveLayers : myLayersSeed);

  const filtered = useMemo(() => {
    let list = myLayers;
    if (tab === "drafts") list = list.filter((l) => l.status === "draft");
    if (tab === "published") list = list.filter((l) => l.status === "published");
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((l) => `${l.title} ${l.sourceTitle} ${l.excerpt} ${l.content} ${l.tags?.join(" ")}`.toLowerCase().includes(query));
    }
    return list;
  }, [myLayers, tab, q]);

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader onSearch={setQ} />
      <div className="sticky top-[64px] z-30 border-b bg-background">
        <div className="mx-auto max-w-screen-sm px-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <main className="mx-auto max-w-screen-sm space-y-3 px-3 py-3 pb-24">
        <AnimatePresence mode="popLayout">
          {filtered.length ? (
            filtered.map((l) => (
              <motion.div key={l.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                <LayerCard l={l} />
              </motion.div>
            ))
          ) : (
            <EmptyState />)
          }
        </AnimatePresence>
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center">
        <div className="pointer-events-auto mx-auto w-full max-w-screen-sm px-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-12 w-full rounded-full text-base shadow-lg"><Plus className="mr-2 h-5 w-5"/> New Layer</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Create a Layer</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickAction icon={<Layers className="h-5 w-5"/>} title="Blank layer"/>
                <QuickAction icon={<BookOpen className="h-5 w-5"/>} title="From paragraph"/>
              </div>
              <SheetFooter className="mt-4">
                <Button className="w-full rounded-full">Open Composer</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}


