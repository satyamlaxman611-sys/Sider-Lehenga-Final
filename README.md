# SIDER LEHENGA — E-commerce (Vanilla + Vercel + Razorpay + GitHub JSON)

## Overview
Premium lehenga store with static frontend (HTML/CSS/JS), Vercel serverless backend APIs, Razorpay payments, and GitHub JSON storage for orders.

## Tech stack
- HTML, CSS, Vanilla JavaScript
- Vercel Serverless Functions (Node.js 18, no Express)
- Razorpay Standard Checkout (LIVE)
- GitHub Contents API (orders saved into data/orders.json)

## Folder structure
See project root tree (index.html at root, /api functions, /admin panel).

## Razorpay setup
Add env vars in Vercel:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

## GitHub JSON storage setup
Create a Fine-grained PAT and add Vercel env vars:
- GITHUB_TOKEN
- GITHUB_OWNER
- GITHUB_REPO
- GITHUB_BRANCH (main)
- GITHUB_ORDERS_PATH (data/orders.json)

Initialize `data/orders.json` with:
[]
Commit it to the repo.

## Deploy to Vercel
1. Push to GitHub
2. Import in Vercel
3. Add env vars
4. Deploy

## Admin panel
- /admin/panel-auth-9x72.html
- /admin/panel-dashboard-x2872.html

## Security notes
- Never expose Razorpay Key Secret in frontend.
- Keep GitHub token only in Vercel env vars.
