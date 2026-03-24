# Memory

## 2026-03-23

- Reviewed the full stack project structure and current local changes.
- Fixed frontend reliability issues caused by unstable effect usage, loose `any` typing, and inconsistent admin page implementations.
- Rebuilt these frontend files into clean working versions:
  - `frontend/src/pages/Admin/Login.tsx`
  - `frontend/src/pages/Admin/Products.tsx`
  - `frontend/src/pages/Admin/Announcement.tsx`
  - `frontend/src/pages/Admin/Settings.tsx`
  - `frontend/src/pages/Home/index.tsx`
- Added shared API error helpers in `frontend/src/api/index.ts`.
- Adjusted `frontend/src/components/FilterBar.tsx` to avoid unsafe effect/function ordering.
- Fixed wildcard CORS handling in `backend/src/app.ts` so `CORS_ORIGIN=*` works as intended.

## Validation

- `cd backend && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `docker compose up -d --build`
- Verified `GET http://localhost/`
- Verified `GET http://localhost/api/config`
- Verified `GET http://localhost/api/products?page=1&pageSize=3`
- Verified `POST http://localhost/api/admin/login`
- Verified authenticated `GET http://localhost/api/admin/products?page=1&pageSize=2`
- Verified authenticated `GET http://localhost/api/admin/config`
- Smoke tested authenticated create, update, and delete on `POST/PUT/DELETE http://localhost/api/admin/products`

## Current Status

- Docker services `db`, `backend`, and `frontend` are running.
- Backend migrations and runtime seed completed successfully during container startup.
- Frontend lint is clean.
- Frontend and backend builds both pass.

## 2026-03-24

- Reviewed the running Docker deployment and revalidated the full stack locally.
- Hardened `backend/src/controllers/adminController.ts` so admin login, create, and update flows now trim text inputs and reject invalid numeric/unit payloads with `400` instead of leaking `500` errors from Prisma.
- Rebuilt `backend/src/controllers/productController.ts` to normalize whitespace-only query parameters, so blank public/admin searches no longer behave like accidental filters.
- Fixed `frontend/src/components/FilterBar.tsx` so clearing keyword or location inputs immediately refreshes the product list instead of leaving stale filters applied.
- Fixed `frontend/src/pages/Admin/Products.tsx` so the admin search box is controlled and clearing it resets the table query immediately.

## Validation (2026-03-24)

- `cd backend && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `docker compose up -d --build`
- Verified `GET http://localhost/api/products?keyword=%20%20&page=1&pageSize=1` returns the full dataset instead of a whitespace-filtered result.
- Verified authenticated `GET http://localhost/api/admin/products?keyword=%20Provider%2048%20&page=1&pageSize=5` trims the keyword and returns the expected record.
- Verified authenticated invalid create payload on `POST http://localhost/api/admin/products` returns `400` with a validation error instead of a server error.
- Smoke tested authenticated create, update, and delete on `POST/PUT/DELETE http://localhost/api/admin/products` after the validation changes.

## 2026-03-24 (Docs)

- Rewrote `docs/deployment.md` into a more precise 1Panel deployment guide with concrete commands, exact path examples, explicit `.env` content, and exact `docker-compose.yml` port mapping changes for 1Panel reverse proxy deployment.
- Reworked deployment maintenance section `11.3` to use the 1Panel scheduled task model instead of manual file replacement, including a GitHub-driven update workflow that rebuilds and reapplies containers.
- Added a reusable deployment helper script at `scripts/update-from-github.sh` so 1Panel tasks can call a stable script path instead of pasting a long inline shell body each time.
- Documented the exact 1Panel scheduled task fields: task type, task name, schedule, interpreter, user, and script content.
- Added operational notes about preserving server-side `.env`, the effect of `git reset --hard`, and using SSH remotes if the GitHub repository becomes private.

## 2026-03-24 (UI Modernization)

- Redesigned the entire frontend UI for a more premium, modern, and "stunning" look:
  - Updated `ConfigProvider` with a vibrant Indigo theme, larger border radii (12px-16px), and refined component tokens.
  - Implemented **Glassmorphism** across all main panels (Header, FilterBar, Announcement, ProductTable, ProductCard).
  - Added a dynamic **Mesh Gradient** background with animated floating decorative blobs on the Home and Login pages.
- Enhanced UX states across the application:
  - Added **Spring-based Bouncy Animations** to all interactive elements (buttons, inputs, cards).
  - Implemented better **Loading** states using consistent spinners and skeleton-like spacing.
  - Added **Empty** states using Ant Design's Empty component for the product list when no results are found.
  - Improved **Hover and Focus** states with subtle scaling and glow effects.
- Modernized the **Admin Dashboard** and **Login Page** with a contemporary dark/light hybrid design and improved layout spacing.
- Fixed multiple lint errors and unused variables related to the UI refactor.
- Pushed all changes to the GitHub repository.

## Validation (2026-03-24 UI)

- Verified `npm run build` in the frontend passes with 0 errors.
- Confirmed all visual components (Header, Cards, Table) successfully integrate the new design system.
- Validated responsiveness for mobile and desktop views across all modified components.

## 2026-03-24 (UI Optimization & Multi-Device Adaptation)

- Analyzed multi-device adaptation and implemented modern design enhancements:
  - **Skeletal Loading**: Replaced generic loading spinners with custom `ProductSkeleton` components for both card and table views, improving perceived performance.
  - **Hardware Progress Bars**: Created `VpsProgress` component to visually represent CPU, RAM, and Disk specifications with colored gauges.
  - **Staggered Entrance Animations**: Implemented CSS-based sequential fade-up animations for product list items (cards and table rows) to create a more dynamic feel.
  - **Refined Glassmorphism**: Increased backdrop-filter blur to 28px and added subtle shadows/borders for a more premium "frosted" look across Header, FilterBar, and Panels.
  - **Dynamic Backgrounds**: Added interactive floating mesh gradient blobs with `float` animations to the Home page.
  - **Tablet Adaptation**: Updated responsive logic to use a grid-based card layout for screens between 768px and 1200px, rather than the cumbersome horizontally-scrolling table.
  - **UX Polish**: Modernized `FilterBar` with glassmorphism, larger inputs, and improved mobile drawer interactions.
- Fixed multiple lint errors and unused variable warnings in frontend components.
- Verified `npm run build` and `npm run lint` pass successfully in frontend.
- Successfully pushed all changes to the GitHub repository.

## Validation (2026-03-24 UI Optimization)

- Verified the skeleton screen appears correctly during data fetching.
- Confirmed the staggered animation triggers on page load and filter change.
- Validated the 2nd/3rd column grid layout on medium-sized screen simulations.
- Checked progress bars correctly calculate percentages for hardware specs.
- Confirmed glassmorphism effect is consistent across components.

## 2026-03-25 (UI Simplification)

- Simplified the product display by removing visual clutter:
  - **Removed Icons**: Deleted column/section icons for CPU, Memory, and Disk in both the Product Table and Product Cards.
  - **Removed Progress Bars**: Disabled the `VpsProgress` hardware gauges for CPU, RAM, and Disk to achieve a cleaner, text-focused aesthetic.
  - **Cleaned Codebase**: Removed unused icon imports and the `VpsProgress` component import from `ProductTable.tsx` and `ProductCard.tsx`.
- Rebuilt Docker containers and pushed changes to GitHub.

## Validation (2026-03-25 UI Simplification)

- Verified that CPU, Memory, and Disk columns now only show text labels without icons.
- Confirmed that the hardware specification sections in cards no longer show progress bars.
- Verified `npm run build` and `npm run lint` pass in the frontend.

## 2026-03-25 (UI Refinement)

- Addressed horizontal scrollbar and layout issues in `ProductTable.tsx`:
  - **Removed Horizontal Scrollbar**: Replaced fixed `scroll={{ x: 1200 }}` with `scroll={{ x: 'max-content' }}` and reduced column widths to fit standard desktop viewports (1200px+).
  - **Optimized Column Layout**: 
    - Updated specific column widths (Name: 150px, CPU/Memory/Disk: 80px, Order: 100px, etc.).
    - Added `ellipsis: true` to the Product Name column.
  - **Indented Order Column**: Removed `fixed: 'right'` from the "Order" column, allowing it to flow naturally and remain fully visible without horizontal scrolling.
- Adjusted **Order** button typography and scaling in `ProductTable.tsx`:
  - **Font Synchronization**: Set button font size to `12px` and weight to `600` to perfectly match the provider brand tags (e.g., DMIT).
  - **Proportional Resizing**: Reduced button height to `28px` and adjusted padding/border-radius to maintain a balanced, professional look that aligns with the visual weight of other table elements.
- Rebuilt Docker containers and pushed all changes to the GitHub repository.

## Validation (2026-03-25 UI Refinement)

- Verified that the horizontal scrollbar no longer appears on screens >= 1200px.
- Confirmed the "Order" button is fully visible in the table without horizontal sliding.
- Validated the button text and size match the provider tags for a cohesive UI.
- Validated the button text translation in both Chinese and English modes.
- Verified `npm run lint` passes (0 errors, 1 unrelated warning).


