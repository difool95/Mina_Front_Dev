# Auth callback page

**Route:** `/auth/callback`
**File:** [src/pages/AuthCallbackPage.tsx](../../src/pages/AuthCallbackPage.tsx)

This is where the magic link from the sign-in email lands. It has no child components: a logo, a title, a note and a link.

```mermaid
sequenceDiagram
  participant User
  participant Email as Sign-in email
  participant NewTab as New tab: /auth/callback
  participant OldTab as The tab the user started in
  participant Supabase as supabase-js

  User->>Email: clicks the one-time link
  Email->>NewTab: opens /auth/callback with the token
  Supabase->>NewTab: reads the token, stores the session
  Supabase-->>OldTab: cross-tab sync: the old tab gets the session too
  OldTab->>OldTab: AuthProvider updates, StudioPage shows, account set up there
  alt session found
    NewTab-->>User: "You're signed in. Go back to the tab you started in." + "Or continue here"
  else no session
    NewTab-->>User: "This link has expired" + "Back to sign in"
  end
```

**Why this page does no account setup:** opening the link creates a second tab. The tab the user started in picks up the session through supabase-js's cross-tab sync and does the setup there (`useAccountSetup` in `StudioPage`). If this tab set the account up too, the free signup matchas would be granted twice.

While the session is being read, the page renders empty, so the "expired" message never flashes.

Google sign-in doesn't use this page: it returns straight to `/`.
