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

## Validation (2026-03-24 Docs)

- Reviewed `docs/deployment.md` and confirmed the maintenance update section is now `11.3`.
- Reviewed `scripts/update-from-github.sh` to confirm it preserves `.env`, fetches `origin/master`, and runs `docker compose up -d --build --remove-orphans`.
