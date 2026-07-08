# CrimsonMC Store — PRD

## Original Problem
User uploaded a saved HTML file (CrimsonMC Minecraft server store) and asked to turn it into a real, hosted, highly-customisable website.

## User Choices
- Replicate the store faithfully (no admin CRUD panel)
- Keep QR scan-and-pay popup
- Google login for visitors (Emergent OAuth)
- Live Minecraft server status (added now)
- Keep + refine the crimson-green luxury design

## Architecture
- Backend: FastAPI + MongoDB (motor). Routes under /api. Seeds products + config on startup.
  - /api/config, /api/products, /api/server-status (public api.mcsrvstat.us),
    /api/orders, /api/auth/session, /api/auth/me, /api/auth/logout
- Frontend: React (CRA), single Store page. Cinzel + Inter fonts, particles, glass header.
  - AuthContext + AuthCallback for Emergent Google OAuth (session_token cookie)
  - PaymentModal generates UPI QR via api.qrserver.com from config.upi_id

## Implemented (2025-12)
- Faithful crimson/green store: hero, 6 ranks, 5 keys, INR/USD currency toggle
- Live server status (players online) in hero
- Buy -> QR scan-and-pay modal + best-effort order logging
- Google sign-in / logout for visitors
- Fully responsive; tested 100% backend + frontend

## Backlog
- P1: Admin panel to edit config/products/prices + upload real UPI QR image
- P1: Real payment gateway (Razorpay/Stripe) with auto confirmation
- P2: Bundles/flash-sale section with countdown; order history for logged-in users
