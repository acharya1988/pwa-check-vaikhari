Cleanup Plan (Automated Findings) — Updated

Source analyzers: knip, depcheck, ts-prune. All candidates below are suggestions only — do not delete without guarding via snapshot harness and dynamic import checks.

Summary
- knip: Many unused files detected (see details)
- depcheck: Unused deps: @genkit-ai/firebase, wav; Unused devDeps: @types/wav, cross-env, rollup-plugin-visualizer, vite-plugin-inspect; Missing deps: eslint-config-next (for .eslintrc), server-only (used by src/app/genkit.ts)
- ts-prune: Unused exports/types reported across actions, services, UI components

Notes
- Next.js build is now green. Bundle analyzer report saved as perf/baseline/stats.html.
- Node server compression helper added but NOT wired (header changes would violate hard rules).

Top knip findings (excerpt)
```
scripts/snapshot.mjs
server/router.js
server/server.js
src/next.config.ts
server/lib/auth.js
server/lib/compress.js
server/lib/cookies.js
server/lib/firebaseAdmin.js
server/lib/http.js
server/lib/mongo.js
server/migrated/admin.db.inspect.get.js
server/migrated/admin.roles.get.js
server/migrated/admin.roles.post.js
server/migrated/circles.id.posts.get.js
server/migrated/profile.me.get.js
server/migrated/register.js
server/migrated/secure.get.js
src/actions/onboarding.actions.ts
src/actions/search.actions.ts
...
```

depcheck
```
Unused dependencies
* @genkit-ai/firebase
* wav
Unused devDependencies
* @types/wav
* cross-env
* rollup-plugin-visualizer
* vite-plugin-inspect
Missing dependencies
* eslint-config-next: ./.eslintrc.cjs
* server-only: ./src/app/genkit.ts
```

ts-prune (excerpt)
```
\middleware.ts:6 - middleware
\tailwind.config.ts:4 - default
\src\next.config.ts:66 - default
... many component/service exports ...
```

Applied safe removals (provably unused)
- Removed src/next.config.ts (duplicate/unused; root config is used). Verified build stays green.
- Removed src/components/admin/organizations/organization-designer.tsx (no references in codegraph; replaced by app route page version). Verified build stays green.

Proposed next steps
- Extend snapshot harness to cover key UI pages (in addition to API): run Next locally and HTML-snapshot selected routes.
- Re-run analyzers and confirm with dynamic import checks before subsequent removals.
- Remove only items proven unused; rebuild and snapshot-diff after each batch.
