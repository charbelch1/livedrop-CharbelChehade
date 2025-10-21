Storefront v1

Run instructions

- install: `pnpm install` (or `npm install`)
- copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your API (e.g., `http://localhost:8080`)
- dev: `pnpm dev` (or `npm run dev`)
- build: `pnpm build` (or `npm run build`)
- test: `pnpm test` (or `npm run test`)
- storybook: `pnpm storybook` (or `npm run storybook`)

 Notes

- Uses Vite + React + TypeScript + Tailwind.
- Mock data under `public/mock-catalog.json`.
- Routes: `#/`, `#/p/:id`, `#/cart`, `#/checkout`, `#/order/:id`.
- Ask Support talks to the backend assistant at `${VITE_API_BASE_URL}/api/assistant/message`. If `VITE_API_BASE_URL` is not set, it falls back to local mock data.
- No secrets are stored; if using a live model later, add keys to `.env` and reference `.env.example`.

