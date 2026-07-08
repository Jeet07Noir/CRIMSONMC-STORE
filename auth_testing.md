# Emergent Auth Testing Playbook

## Step 1: Create Test User & Session (mongosh)
Use DB `test_database`, collections `users` and `user_sessions`.
- users: { user_id, email, name, picture, created_at }
- user_sessions: { user_id, session_token, expires_at, created_at }

## Step 2: Backend API
- GET /api/auth/me with `Authorization: Bearer <session_token>` -> returns user
- POST /api/auth/logout -> clears session

## Step 3: Browser
Set cookie `session_token` (httpOnly, secure, sameSite None) then load app.

Success: /api/auth/me returns user; header shows avatar; no redirect loops.
