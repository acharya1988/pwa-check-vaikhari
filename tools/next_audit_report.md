Next.js Presence Audit

Commands and outputs

1) Does package.json depend on Next?
Command: node -e "const p=require('./package.json'); console.log(p.dependencies?.next||p.devDependencies?.next||'NO_NEXT')"
Output: node not available in direct shell; package.json shows "next": "^15.5.2" in dependencies.

2) Next-specific folders or build artifacts?
Command: ls -d app pages .next
Output:
.next

3) Next config present?
Command: ls next.config.*
Output:
next.config.mjs
next.config.ts

4) Imports that only exist in Next?
Command: grep -R --line-number "from 'next" src app pages | head -n 20
Output: many imports, e.g. next/navigation, next/cache, next/link

5) Scripts that run Next?
Command: node -e "const p=require('./package.json'); console.log(p.scripts)"
Output: node not available in direct shell; scripts include dev/build/start using Next.

Conclusion
- Next.js is the active frontend in this repo. This is expected.

Path Chosen: A) Keep Next as the UI

Actions taken
- Removed Vite-only devDeps that aren’t used in a Next build:
  - rollup-plugin-visualizer
  - vite-plugin-inspect
- Kept @next/bundle-analyzer for bundle insights.

Notes
- The "note" about Next presence is expected because this is a Next.js project.
- No Vite config/files detected in the repo; removing unused Vite-related devDeps reduces noise only.

