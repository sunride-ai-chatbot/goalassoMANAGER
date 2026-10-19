# Phase 2 · Supabase setup (to do once)

1. In the GOALASSO_MANAGER organization create a project (region close to Israel, e.g. Frankfurt). Keep the database password to yourself.
2. Authentication → Sign In / Providers → Email: enabled. "Confirm email" on.
3. Authentication → Email Templates → **Magic Link**: put the code in the email, e.g.
   `<p>קוד הכניסה שלך ל-GOALASSO: {{ .Token }}</p>` — this is what makes Supabase send a 6-digit code instead of a link.
4. Authentication → URL Configuration: Site URL = the address where the game is hosted (GitHub Pages URL).
5. For real users configure **Custom SMTP** (Authentication → Emails → SMTP). The built-in sender is for testing only.
6. SQL Editor → run `supabase/migrations/20261019000000_single_player_careers.sql`.
7. Project Settings → API: copy the **Project URL** and the **anon / publishable key** (public values). Do not share the service_role / secret key.

Client flow (official API): `supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:true } })` then
`supabase.auth.verifyOtp({ email, token, type:'email' })`. Default: 6-digit code, 1-hour expiry, one request per 60 s per user.
