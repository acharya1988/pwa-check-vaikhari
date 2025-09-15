import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Grid,
  List,
  Users,
  Filter as FilterIcon,
  MessageCircle,
  UserPlus,
  Zap,
  Check,
  Sparkles,
  X,
} from "lucide-react";

// Mock data generator (replace with API calls)
const generatePeople = (count = 18, offset = 0) => {
  const roles = ["Scholar", "Collaborator", "Enthusiast", "Doctor", "Student"];
  const skills = [
    "Ayurveda",
    "Sanskrit",
    "Panchakarma",
    "Tantra",
    "Yoga Therapy",
    "Dravyaguna",
    "Rasashastra",
  ];

  return Array.from({ length: count }).map((_, i) => {
    const id = offset + i + 1;
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffled = skills.sort(() => 0.5 - Math.random()).slice(0, 3);
    return {
      id,
      name: `Name ${id}`,
      title: `${rnd(roles)} • ${Math.floor(Math.random() * 20) + 1} yrs`,
      about:
        "Traditional lineage practitioner with modern research experience. Focus on classical texts and practical therapies.",
      skills: shuffled,
      role: rnd(roles),
      avatar: `https://i.pravatar.cc/150?img=${(id % 70) + 1}`,
      verified: Math.random() > 0.75,
      stats: {
        answers: Math.floor(Math.random() * 200),
        articles: Math.floor(Math.random() * 40),
      },
    };
  });
};

export default function PeopleExplorer() {
  // UI State
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid"); // 'grid' | 'list'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [people, setPeople] = useState(() => generatePeople(18));
  const [loadingMore, setLoadingMore] = useState(false);
  const [quickProfile, setQuickProfile] = useState(null); // person object for drawer

  // Simulate infinite scroll: load more
  const loadMore = async () => {
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 800));
    setPeople((p) => [...p, ...generatePeople(12, p.length)]);
    setLoadingMore(false);
  };

  // Derived filtered list
  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesQuery =
        query.trim() === "" ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.skills.join(" ").toLowerCase().includes(query.toLowerCase()) ||
        p.title.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "All" || p.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [people, query, roleFilter]);

  // Skeletons for loading placeholders
  const SkeletonCard = () => (
    <div className="animate-pulse bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-md">
      <div className="h-36 w-full rounded-lg bg-white/30 mb-3" />
      <div className="h-4 bg-white/30 rounded w-1/2 mb-2" />
      <div className="h-3 bg-white/30 rounded w-3/4" />
    </div>
  );

  // Small utility components
  const RoleChip = ({ role, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm transition-all 
        ${active ? "bg-gradient-to-r from-teal-400 to-violet-500 text-white shadow-lg" : "bg-white/60 text-gray-700"}`}
    >
      {role}
    </button>
  );

  // Card components
  const GridCard = ({ p }) => (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="relative rounded-2xl overflow-hidden p-4 shadow-lg glass-card border border-white/20"
    >
      {/* Accent border glow */}
      <div className="absolute -inset-px rounded-2xl pointer-events-none bg-gradient-to-br from-violet-200/20 via-teal-200/10 to-transparent blur-sm opacity-80" />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div className="relative">
          <img
            src={p.avatar}
            alt={p.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/40 shadow-md"
          />
          {p.verified && (
            <span className="absolute bottom-0 right-0 bg-gradient-to-br from-teal-400 to-violet-500 text-white rounded-full p-1 shadow-md -translate-y-1 translate-x-1">
              <Check size={14} />
            </span>
          )}
        </div>

        <div className="w-full">
          <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
          <p className="text-sm text-slate-500 truncate">{p.title}</p>

          <p className="mt-2 text-xs text-slate-600 line-clamp-2">{p.about}</p>

          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {p.skills.map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded-full bg-white/60">
                {s}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={() => alert(`Follow ${p.name}`)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-400 to-violet-500 text-white shadow-md"
            >
              Follow
            </button>
            <button
              onClick={() => setQuickProfile(p)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white/80 text-slate-800 shadow-sm"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ListCard = ({ p }) => (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-4 p-4 rounded-2xl shadow-md glass-card border border-white/20"
    >
      <img src={p.avatar} alt={p.name} className="w-20 h-20 rounded-full border-2 border-white/40" />
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
          {p.verified && <span className="text-teal-600">✔</span>}
          <span className="ml-auto text-sm text-slate-500">{p.stats.answers} answers</span>
        </div>
        <p className="text-sm text-slate-600">{p.title}</p>
        <p className="mt-2 text-sm text-slate-700 line-clamp-2">{p.about}</p>
        <div className="flex gap-2 mt-3">
          {p.skills.map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded-full bg-white/60">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => alert(`Message ${p.name}`)}
          className="px-4 py-2 rounded-lg bg-white/90 shadow-sm"
        >
          Message
        </button>
        <button
          onClick={() => alert(`Connect ${p.name}`)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-400 to-teal-400 text-white"
        >
          Connect
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen py-10 px-6" style={{ background: 'linear-gradient(180deg, #f5f7ff 0%, #ffffff 40%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="rounded-3xl p-6 mb-8" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(56,189,248,0.06))', boxShadow: '0 6px 24px rgba(15,23,42,0.06)' }}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">People Explorer</h1>
              <p className="text-sm text-slate-600 mt-1">A modern blend of discovery — learn from scholars, connect with collaborators, and explore enthusiasts.</p>

              <div className="mt-4 flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-3 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, skill or title..."
                    className="pl-10 pr-4 py-3 rounded-full w-full md:w-[520px] bg-white/90 shadow-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView("grid")}
                    className={`p-2 rounded-lg shadow-sm ${view === "grid" ? "bg-gradient-to-r from-teal-400 to-violet-500 text-white" : "bg-white/80 text-slate-700"}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`p-2 rounded-lg shadow-sm ${view === "list" ? "bg-gradient-to-r from-teal-400 to-violet-500 text-white" : "bg-white/80 text-slate-700"}`}
                  >
                    <List size={18} />
                  </button>

                  <button
                    onClick={() => setFiltersOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 shadow-sm"
                  >
                    <FilterIcon size={16} /> Filters
                  </button>
                </div>
              </div>

              {/* Filters panel */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4 p-4 rounded-xl bg-white/70 shadow-md flex gap-3 items-center flex-wrap"
                  >
                    {[
                      "All",
                      "Scholar",
                      "Collaborator",
                      "Enthusiast",
                      "Doctor",
                      "Student",
                    ].map((r) => (
                      <RoleChip key={r} role={r} active={roleFilter === r} onClick={() => setRoleFilter(r)} />
                    ))}

                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => {
                          setRoleFilter("All");
                          setFiltersOpen(false);
                        }}
                        className="px-3 py-1 rounded-full bg-white/80"
                      >
                        Reset
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trending / suggestion */}

            <div className="w-full md:w-64">
              <div className="p-4 rounded-2xl glass-card border border-white/20 shadow-sm">
                <h4 className="text-sm font-semibold">Trending</h4>
                <p className="text-xs text-slate-500 mt-2">People rising in engagement this week</p>
                <div className="mt-3 flex flex-col gap-2">
                  {people.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <img src={p.avatar} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.title}</div>
                      </div>
                      <button
                        onClick={() => alert(`Follow ${p.name}`)}
                        className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 text-white text-xs"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">Showing <strong>{filtered.length}</strong> people</div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Zap size={16} /> Personalized suggestions
          </div>
        </div>

        {/* Grid / List */}
        <div>
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <GridCard key={p.id} p={p} />
              ))}

              {loadingMore && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((p) => (
                <ListCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>

        {/* Load more */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 text-white shadow-lg"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      </div>

      {/* Quick Profile Drawer */}
      <AnimatePresence>
        {quickProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setQuickProfile(null)} />

            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="relative z-20 w-full md:max-w-2xl bg-white/90 rounded-2xl p-6 shadow-2xl glass-card"
            >
              <div className="flex items-start gap-4">
                <img src={quickProfile.avatar} className="w-28 h-28 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{quickProfile.name}</h2>
                    {quickProfile.verified && <span className="text-teal-600">✔ Verified</span>}
                    <div className="ml-auto text-sm text-slate-500">{quickProfile.role}</div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{quickProfile.about}</p>

                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-400 to-violet-500 text-white">Follow</button>
                    <button className="px-4 py-2 rounded-lg bg-white/90">Message</button>
                    <button className="px-4 py-2 rounded-lg bg-white/90">Invite to Circle</button>
                  </div>
                </div>
                <button onClick={() => setQuickProfile(null)} className="text-slate-600">
                  <X />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/80">
                  <div className="text-xs text-slate-500">Answers</div>
                  <div className="text-lg font-semibold">{quickProfile.stats.answers}</div>
                </div>
                <div className="p-4 rounded-lg bg-white/80">
                  <div className="text-xs text-slate-500">Articles</div>
                  <div className="text-lg font-semibold">{quickProfile.stats.articles}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* styles for glass-card and line-clamp fallback */}
      <style jsx>{`
        .glass-card { background: linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.55)); }
        .line-clamp-2 { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
      `}</style>
    </div>
  );
}

/*
  USAGE NOTES:
  - This component is intentionally self-contained so it can be dropped into your React app.
  - Replace mock generatePeople() with real API calls (pagination + search + filters).
  - Tailwind classes assume your project has a modern Tailwind setup and the lucide-react icon package installed.
  - Glassmorphism and gradients are done via inline styles + Tailwind utility classes for clarity.
*/
