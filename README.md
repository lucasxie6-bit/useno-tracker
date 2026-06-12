# Useno tracker

Single-page milestone + task kanban board. Data persists in browser localStorage (per-device, not synced across devices).

## Run locally
```
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Defaults work as-is (Next.js auto-detected). Click Deploy.

## Notes
- Data is stored in `localStorage` under key `useno-tracker-items` — clearing browser data wipes it.
- Edit `DEFAULT_ITEMS` in `pages/index.js` to change the starting seed data.
- To make data sync across devices, you'd need a backend (e.g. add a database + API routes) — ping me if you want that upgrade.
