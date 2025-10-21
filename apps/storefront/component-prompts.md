
1) Project scaffold
"Create a Vite React + TypeScript app in apps/storefront with TailwindCSS, Vitest, and Storybook. Add index.html, src/main.tsx, src/app.tsx. Configure Tailwind (postcss.config.cjs, tailwind.config.cjs) and include Tailwind base/components/utilities in src/index.css. Add npm scripts in apps/storefront/package.json for dev, build, preview, and test using vitest + jsdom. Keep dependencies minimal (react, react-dom, zustand, tailwindcss, vitest, @testing-library/react, @testing-library/user-event). Add vite.config.ts and vitest.config to support ts + jsx + jsdom."

2) Atomic structure and pages
"Under src/, create directories: pages (catalog.tsx, product.tsx, cart.tsx, checkout.tsx, order-status.tsx), components/{atoms,molecules,organisms,templates}, lib, and assistant. Follow Atomic Design. Each component gets a .tsx, .test.tsx, and .stories.tsx where applicable."

3) Router (hash-based)
"Implement a tiny hash-based router in src/lib/router.tsx with <Router>, <Route>, <Link>, useParams, and useNavigate. Support dynamic segments like /p/:id. Store current path from location.hash, update on hashchange, and provide a simple Nav context."

4) Currency helpers
"In src/lib/format.ts, export formatCurrency(n: number): string using Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}) and any tiny helpers needed for totals display."

5) Cart store (Zustand with localStorage)
"In src/lib/store.ts, create a zustand store with items: CartItem[] and actions add(item, qty?), remove(id), setQty(id, qty), clear(). Persist to localStorage under a stable key and rehydrate on load. Export total(items) to sum price*qty."

6) Mock API + order status
"In src/lib/api.ts, implement listProducts() loading /mock-catalog.json, getProduct(id), placeOrder(cart) returning { orderId } (random A–Z0–9 id len 12) and persisting an order map in localStorage. Add getOrderStatus(id) that returns status among Placed, Packed, Shipped, Delivered, occasionally progressing state; when Shipped/Delivered include carrier and etaDays. Export Product type."

7) Public assets
"Add apps/storefront/public/logo.svg and apps/storefront/public/mock-catalog.json with ~20 items: { id, title, price, image, tags, stockQty }. Use small placeholder image URLs or local paths."

8) App shell and layout
"Create src/components/templates/AppLayout.tsx with a responsive shell: header with logo link to '/', a simple nav, a content <main>, and a persistent <SupportPanel /> rendered on all routes. Add AppLayout.stories.tsx documenting default layout. In src/app.tsx, wrap routes in <Router> and render AppLayout with Route components for '/', '/p/:id', '/cart', '/checkout', '/order/:id'. In src/main.tsx, render <App /> and import index.css."

9) Atoms
- Button: "Create Button.tsx as a styled button atom using Tailwind, accepts standard button props and className merge; accessible, disabled styles, hover. Add Button.test.tsx with basic render/click and disabled behavior. Add Button.stories.tsx with primary/disabled variants."
- Input: "Create Input.tsx as a styled input atom forwarding ref, supports placeholder and aria-label; ensure focus styles. Add Input.test.tsx to verify typing/change events and a11y label. Add Input.stories.tsx with default and with placeholder."

10) Molecule: ProductCard
"Create ProductCard.tsx that displays image, title (link to /p/:id), formatted price via formatCurrency, and an 'Add to Cart' Button. Props: { id, title, price, image, onAdd }. Ensure image has alt, uses loading='lazy', and the add button has aria-label 'Add {title} to cart'. Add ProductCard.test.tsx to check links, button click calls onAdd, and price format. Add ProductCard.stories.tsx with sample data."

11) Organism: SupportPanel
"Create SupportPanel.tsx slide-over anchored bottom-right trigger button 'Ask Support'. Clicking opens a right-side panel with focus trap, Escape to close, aria-modal dialog semantics, an Input and a Send Button. On submit, call askSupport(query) and render the response text area with aria-live polite. Add SupportPanel.test.tsx to cover open/close via click and Escape, focus trap, submitting a known question returns text with [Qxx], out-of-scope refusal, and order id including masked id and status. Add SupportPanel.stories.tsx with default state."

12) Assistant engine and prompt template
"In src/assistant/prompt.txt, write a short instruction describing constraints: only answer using ground-truth.json and getOrderStatus(), refuse out-of-scope, mask PII (show last 4), always append citation [Qxx], detect order ids via /[A-Z0-9]{10,}/."
"In docs/ground-truth.json, include 20 Q&A items: { id:'Policy1.1', category:'Returns'|'Shipping'|'Order'|..., question, answer }."
"In src/assistant/engine.ts, implement askSupport(query) that: (1) detects order ids, calls getOrderStatus(id), formats 'Order ****1234 status: ...' with carrier/ETA when Shipped or later, citing the 'Order' Qid; else (2) scores ground-truth items by keyword overlap on question/answer, selects best above a confidence threshold ~0.35; else refuses with a generic message. Export types and pure helpers as needed. Add engine.test.ts to cover the three test cases from the assignment."

13) Pages
- Catalog (src/pages/catalog.tsx): "Fetch listProducts(); render a responsive grid of ProductCard. Add search box that tokenizes query and filters by title/tags. Add sort (price asc/desc) and basic tag filter. Hook ProductCard onAdd into useCart()."
- Product (src/pages/product.tsx): "Use useParams() to get :id, fetch getProduct(id), display image, title, description, price, stock indicator, add-to-cart. Compute and render 3 related items by shared tag."
- Cart (src/pages/cart.tsx): "Render line items with image, title, price, qty +/- and remove. Show totals using formatCurrency and a 'Checkout' link. Persist via useCart store which already uses localStorage."
- Checkout (src/pages/checkout.tsx): "Render summary only; on 'Place order' call placeOrder(cart) then navigate('/order/{orderId}') and clear cart."
- Order Status (src/pages/order-status.tsx): "Read :id, call getOrderStatus(id) and display status, and when Shipped/Delivered show carrier + ETA."

14) Index.html and CSS
"In apps/storefront/index.html, add a root div and include script from Vite. Ensure link to /public/logo.svg for favicon if desired. In src/index.css, import Tailwind base/components/utilities and add small custom utility tweaks if needed."

15) README and scripts
"Write apps/storefront/README.md with instructions: install, pnpm dev, pnpm build, pnpm test. Mention .env example if supporting live model calls (optional)."

16) Testing pass
"Use Vitest + @testing-library/react to run unit tests for atoms, molecules, organisms, and assistant engine. Ensure jsdom environment and happy path tests pass." 




