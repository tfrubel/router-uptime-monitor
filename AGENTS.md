# Agent instructions

## Next.js 16 — read the docs first

This project uses Next.js **16.2.6** which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — API conventions, file structure, and behavior may differ from your training data. Heed deprecation notices.

## Package manager

**bun** — use `bun` for install, run scripts, etc. Do not use npm/yarn/pnpm.

## Key commands

```bash
bun run dev          # dev server
bun run build        # production build
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run format       # prettier --write
```

## Project structure

- `app/` — Next.js App Router (layout.tsx, page.tsx, globals.css)
- `components/ui/` — shadcn/ui components
- `components/theme-provider.tsx` — dark mode provider (client component)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `hooks/` — custom hooks (empty, for future use)
- Path alias: `@/*` maps to project root

## shadcn/ui

- Style: **base-vega** with CSS variables (oklch colors)
- Icons: **Phosphor** (`@phosphor-icons/react`)
- Add components: `npx shadcn@latest add <component>`
- Config: `components.json` — aliases, tailwind config, registries

## Styling

- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`)
- Prettier plugin auto-sorts Tailwind classes
- Dark mode: class-based (`next-themes`), toggle with `d` key
- Fonts: IBM Plex Sans (body), Source Sans 3 (headings), Geist Mono

## Code style

- **No semicolons**, double quotes, trailing commas (es5), 2-space indent
- Format command handles Tailwind class sorting automatically
- ESLint: next core-web-vitals + typescript rules
- UI Building: always use `shadcn` skill to generate components, then customize. Avoid hand-coding UI components unless necessary.
