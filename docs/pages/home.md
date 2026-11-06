# Home page (the login screen)

**Route:** `/` when signed out, and `/add-account` when adding a second account.
**File:** [src/pages/HomePage.tsx](../../src/pages/HomePage.tsx)

![Home page with its components labelled](../screenshots/home-annotated.png)

## Component tree

```mermaid
flowchart TD
  HomePage["HomePage<br/>div.mina-home"]
  HomePage --> Bar["header: logo + Tutorial button"]
  HomePage --> Carousel["Carousel<br/>media = carousel_media rows"]
  Carousel -.->|"on hover"| GlassDisc["GlassDisc (prev / next)"]
  HomePage --> LoginPanel["LoginPanel"]
  HomePage --> Footer["footer: Policies, Terms, Refund, Need help?"]
  HomePage -.->|"tutorialOpen"| TutorialPanel["TutorialPanel<br/>onClose"]
  TutorialPanel --> VideoPlayer["VideoPlayer"]
  HomePage -.->|"a legal link clicked"| LegalPanel["LegalPanel<br/>title, body, onClose"]
  LegalPanel --> Markdown["Markdown<br/>source = body"]
```

Dotted arrows are rendered only in some states.

## Where the content comes from

Everything on this page except the login buttons comes from one Supabase table, `onboard_content`:

```mermaid
flowchart LR
  HomePage -- "useOnboardContent()" --> Hook["hooks/useOnboardContent.ts<br/>key ['onboardContent'], cached forever"]
  Hook --> Service["services/onboardContent.service.ts<br/>getOnboardContent()"]
  Service --> Table[("onboard_content<br/>is_active = true, by sort_order")]
  HomePage -- "pickRows(data, 'carousel_media')<br/>pickRow(data, 'legal_privacy')" --> Lib["lib/onboardContent.ts"]
```

- **The carousel pictures:** the `carousel_media` rows.
- **The Tutorial button label:** from its row, or "Tutorial".
- **The legal texts** (`legal_privacy`, `legal_terms`, `legal_refund`): Markdown, rendered by [Markdown.tsx](../../src/components/Markdown.tsx).

To change any of them, edit the table, not the code.

## Signing in

[LoginPanel.tsx](../../src/components/LoginPanel.tsx) offers two ways:

| Button | Calls | What happens |
|---|---|---|
| Login with Google | `signInWithGoogle()` in [auth.service.ts](../../src/services/auth.service.ts) | Supabase redirects to Google, then back to `/`. |
| Use email instead | `sendMagicLink(email)` | Supabase emails a one-time link that opens [`/auth/callback`](auth-callback.md). |

![The email step of the login panel](../screenshots/home-email.png)

Once Supabase has a session, `AuthProvider` updates `useAuth().session`, and `RootRoute` in [App.tsx](../../src/App.tsx) swaps this page for the [Studio](studio.md).

## The panels

| Panel | Opened by | Closed by |
|---|---|---|
| [TutorialPanel](../../src/components/TutorialPanel.tsx) | the Tutorial button | Skip, or Sign in |
| [LegalPanel](../../src/components/LegalPanel.tsx) | Policies, Terms or Refund in the footer | the close button, Escape, a click outside |

![Tutorial panel](../screenshots/tutorial-annotated.png)

![Legal panel](../screenshots/legal-annotated.png)
