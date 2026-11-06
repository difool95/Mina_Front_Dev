# Profile page

**Route:** `/profile` (sends a signed-out visitor back to `/`).
**File:** [src/pages/ProfilePage.tsx](../../src/pages/ProfilePage.tsx)

The profile has three parts:
- **the account row:** email, brand memory, auto-matcha, balance, logout, invoices;
- **the brand memory bar**, hidden until opened;
- **the archive** of every finished generation.

![Profile page](../screenshots/profile-annotated.png)

## Component tree

```mermaid
flowchart TD
  ProfilePage["ProfilePage<br/>holds: filters, opened creation, open panel, matchaPanel"]
  ProfilePage --> Head["Table: logo, RoleTagCard, Get more Matcha"]
  ProfilePage --> Account["Table: account row"]
  Account -->|"email, accounts, onSwitch, onAdd"| AccountMenu
  ProfilePage -.->|"Brand Memory clicked"| BrandMemoryBar
  BrandMemoryBar -->|"tiles, onReorder, onAdd"| AssetTiles
  BrandMemoryBar -.->|"a tile clicked"| BrandingAssetsPanel["BrandingAssetsPanel<br/>memory, onClose"]
  BrandingAssetsPanel --> AssetTiles2["AssetTiles (the memory's pictures)"]
  ProfilePage --> Filters["archive filters: date, mode, Liked, ratio, layout"]
  ProfilePage -->|"one per generation:<br/>generation, placement, isPanelOpen,<br/>onTogglePanel, onOpen, onDownload, onDelete"| CreationCard
  ProfilePage -.->|"loading"| CreationSkeleton
  CreationCard --> CreationMedia
  CreationCard -->|"generation, isOpen, onToggle<br/>(isPanelOpen and onTogglePanel from ProfilePage, passed on)"| CreationOtherPanel
  ProfilePage -.->|"a creation opened"| CreationFullScreen["CreationFullScreen<br/>generation, onClose, onNavigate, ..."]
  CreationFullScreen -.-> VideoPlayer
  CreationFullScreen -.-> GlassDisc
  ProfilePage -.-> MatchaPanel
  ProfilePage -.-> AutoMatchaPanel
  ProfilePage -->|"mobileOnly"| AppFooter
```

The page keeps the list state: which filters are on, which card's details panel is open (only one at a time), and which creation is full screen. The cards only report clicks through callbacks.

## The account row

![Account menu open](../screenshots/profile-account-menu-annotated.png)

| Item | Does | Through |
|---|---|---|
| Email ▾ (`AccountMenu`) | switch to another account saved on this browser, or add one | `useSwitchAccount`, `/add-account`. See [accounts](../features/accounts.md). |
| Brand Memory / ON | opens the bar below / turns brand memory on or off | `useBrandMemoryOn`, `useSetBrandMemoryOn` |
| Auto-Matcha ON | opens `AutoMatchaPanel` | `useUpdateAutoRefill` |
| Matcha, Best before | balance and when the oldest matchas expire | `useCustomerCredits` |
| Logout | signs out this account only, and switches to the next saved one | `useSignOutAccount` |
| Invoices | opens the Stripe billing portal | `useBillingPortal` |

## Brand memory bar

![Brand memory bar](../screenshots/profile-brand-memory-annotated.png)

[BrandMemoryBar.tsx](../../src/components/brandMemory/BrandMemoryBar.tsx) lists every memory as a tile:
- **"+" or a drop:** creates memories (pictures, folders, `.zip` or a Shopify CSV, through `lib/brandMemoryImport.ts`);
- **dragging a tile:** reorders;
- **holding a tile:** selects it, for deleting several at once;
- **clicking a tile:** opens the memory.

![Branding assets panel](../screenshots/profile-branding-assets-annotated.png)

[BrandingAssetsPanel.tsx](../../src/components/brandMemory/BrandingAssetsPanel.tsx) edits one memory: its pictures (the first is the cover), category, name and description. Save writes `mg_mma_vars` back to Supabase (`useUpdateBrandMemory`). Delete removes the memory row and its pictures in R2 (`useDeleteBrandMemories`). More in [features/brand-memory.md](../features/brand-memory.md).

## The archive

Every finished generation (`mg_status` and `mg_mma_status` = `done` or `succeeded`), newest first, from `useGenerations`. The filters and the two layouts (editorial and library) are worked out in [lib/generations.ts](../../src/lib/generations.ts).

![A creation with its details open](../screenshots/profile-creation-details-annotated.png)

[CreationOtherPanel.tsx](../../src/components/CreationOtherPanel.tsx) ("more") reads everything from the generation's `mg_mma_vars`:
- the full prompt;
- type, lane, resolution, ratio;
- the matcha it cost (`meta.billing.matchas`);
- the pictures that were used;
- Like, Prompt file and Copy link.

Clicking the picture opens [CreationFullScreen.tsx](../../src/components/CreationFullScreen.tsx):

![Full screen](../screenshots/profile-fullscreen-annotated.png)

Each card's menu button (top right) deletes it. That's a soft delete: the row is marked `deleted` and disappears from the list. See [features/archive.md](../features/archive.md).

## Hooks used on this page

`useAuth`, `useQueryClient`, `useSwitchAccount`, `useSignOutAccount`, `useBrandMemoryOn`, `useSetBrandMemoryOn`, `useGenerations`, `useLikedGenerations`, `useCustomerCredits`, `useBillingPortal`, `useDeleteGeneration`, `useDownloadMedia`, `useCopyLink`, `useCopyMedia`. The brand memory components add `useBrandMemories`, `useCreateBrandMemory`, `useUpdateBrandMemory`, `useDeleteBrandMemories`, `useUploadStudioImage`, `useDownloadPicture`.

**After a Stripe purchase,** Stripe sends the user back to `/profile?purchase=success`. The page invalidates `['customer', userId]` so the new balance shows, then removes the parameter from the URL.
