# Reference: hooks, services and what they hit

Use this page to answer "where does this data come from?" or "who calls this?". Follow a row from left to right: **hook → service function → what it hits**.

**API** means `Mina_Back_Dev`, through `apiPost` / `apiDelete` in [services/api.client.ts](../src/services/api.client.ts). That client adds `Authorization: Bearer <Supabase access token>` to every request. **Supabase** means a direct call with the anon key and the user's session.

## Generations ([hooks/useGenerations.ts](../src/hooks/useGenerations.ts) → [services/generations.service.ts](../src/services/generations.service.ts))

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useGenerations` | `getGenerations` | Supabase `mega_generations`: `generation` rows, `done` or `succeeded` | `ProfilePage`, `RightStudioPanel` |
| `useStartStillGeneration` | `startStillGeneration` | API `POST /api/mma/still` | `StudioPage` |
| `useGenerationStatus` | `getGenerationStatus` | Supabase `generation:<id>`: status, picture, unused memory ids | `StudioPage` |
| `useDeleteGeneration` | `deleteGeneration` | Supabase update: soft delete | `ProfilePage` |
| `useLikedGenerations` | `getLikedGenerationIds` | Supabase `mma_event` rows with `event_type = like` | `ProfilePage`, `RightStudioPanel`, `CreationOtherPanel` |
| `useLikeGeneration` / `useUnlikeGeneration` | `likeGeneration` / `unlikeGeneration` | Supabase insert / delete `mma_event` | `RightStudioPanel`, `CreationOtherPanel` |
| `useDownloadMedia` | `downloadMedia` | the picture's CDN URL | `ProfilePage`, `RightStudioPanel` |
| `useCopyMedia` | `copyMediaToClipboard` | the picture's CDN URL, then the clipboard | `ProfilePage`, `RightStudioPanel` |
| `useCopyLink` | `copyLink` | the clipboard only | `ProfilePage`, `RightStudioPanel`, `CreationOtherPanel` |

## Edit tools ([hooks/useFingertips.ts](../src/hooks/useFingertips.ts) → [services/fingertips.service.ts](../src/services/fingertips.service.ts))

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useStartFingertips` | `startFingertips` | API `POST /api/fingertips/<tool>`, or `<tool>-all` with several pictures | `StudioPage` |
| `useFingertipsStatuses` | `getGenerationStatus`, once per id | Supabase `generation:<id>` rows, every 5 s until each ends | `StudioPage` (the "all" buttons) |

See [features/fingertips.md](features/fingertips.md).

## Brand memory ([hooks/useBrandMemories.ts](../src/hooks/useBrandMemories.ts) → [services/brandMemory.service.ts](../src/services/brandMemory.service.ts))

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useBrandMemories` | `getBrandMemories` | Supabase `product` rows, `done`, by `sort_order` | `BrandMemoryBar`, `useBrandMemoryPicks` |
| `useCreateBrandMemory` | `createBrandMemory` | API `POST /api/brand-memories` | `BrandMemoryBar` |
| `useUpdateBrandMemory` | `updateBrandMemory` | Supabase update of `mg_mma_vars`, `mg_prompt` | `BrandMemoryBar`, `BrandingAssetsPanel` |
| `useDeleteBrandMemories` | `deleteBrandMemory` + `deleteStudioImage` | Supabase delete, then API `DELETE /api/mma/uploads` per picture | `BrandMemoryBar`, `BrandingAssetsPanel` |
| `useBrandMemoryPicks` | none: works on the cached list with `lib/brandMemoryDetect.ts` | nothing | `MinaBlock` |

## Uploads ([hooks/useStudioUploads.ts](../src/hooks/useStudioUploads.ts) → [services/studioUploads.service.ts](../src/services/studioUploads.service.ts))

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useUploadStudioImage` | `uploadStudioImage` | API `POST /api/mma/uploads` (raw picture body) | `MinaBlock`, `BrandMemoryBar`, `BrandingAssetsPanel` |
| `useDeleteStudioImage` | `deleteStudioImage` | API `DELETE /api/mma/uploads` | `MinaBlock`, `BrandingAssetsPanel` |
| `useDownloadPicture` | `downloadPicture` | any picture URL (e.g. a Shopify CDN), as a `File` | `BrandMemoryBar` |

## Account, credits and payments

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useAccountSetup` | `ensureCustomer`, `grantSignupBonus` | Supabase `mega_customers`, API `POST /api/credits/signup-bonus` | `StudioPage` |
| `useCustomerCredits` | `getCustomerCredits` | Supabase `mega_customers` | `StudioPage`, `ProfilePage`, `RoleTagCard` |
| `useUpdateAutoRefill` | `updateAutoRefillPreferences` | Supabase update of `mg_mma_preferences` | `AutoMatchaPanel` |
| `useCheckout` | `createCheckoutSession` | API `POST /api/checkout/session` | `MatchaPanel` |
| `useBillingPortal` | `createBillingPortalSession` | API `POST /api/checkout/portal` | `ProfilePage` |
| `useExchangeRates` | `getRatesFromGbp` | `open.er-api.com` | `MatchaPanel`, `AutoMatchaPanel` |
| `useSwitchAccount` | `switchAccount` | `localStorage` + Supabase Auth `refreshSession` | `ProfilePage` |
| `useSignOutAccount` | `signOutCurrentAccount` | `localStorage` + Supabase Auth `signOut` | `ProfilePage` |
| `useBrandMemoryOn` / `useSetBrandMemoryOn` | `isBrandMemoryOn` / `setBrandMemoryOn` | `localStorage` only | `ProfilePage`, `MinaBlock` |
| (none: called by the provider and `LoginPanel`) | `getSession`, `onAuthChange`, `sendMagicLink`, `signInWithGoogle`, `signOut` | Supabase Auth | `AuthProvider`, `LoginPanel` |
| (none: called by the provider) | `listAccounts`, `rememberAccount` | `localStorage` `mina-accounts` | `AuthProvider` |
| `useAuth` (from [providers/AuthProvider.tsx](../src/providers/AuthProvider.tsx), not `hooks/`) | none: reads the provider's context (`session`, `loading`, `accounts`) | nothing | `App`, `AuthCallbackPage`, `StudioPage`, `ProfilePage`, `MinaBlock`, `RightStudioPanel`, `CreationOtherPanel`, `MatchaPanel`, `AutoMatchaPanel`, `BrandMemoryBar`, `BrandingAssetsPanel`, `RoleTagCard` |

## Content and prompt files

| Hook | Service function | Hits | Used by |
|---|---|---|---|
| `useOnboardContent` | `getOnboardContent` | Supabase `onboard_content` | `HomePage` |
| `useSceneLibrary` | `getSceneLibrary` | Supabase `scene_library` | `SceneLibrary` |
| `useContentLibrary` | `getContentLibrary` | Supabase `content_library` | `ContentCreatorLibrary` |
| `useCreatorLibrary` | `getCreatorLibrary` | Supabase `creators_library` | `ContentCreatorLibrary` |
| `useExportPromptFile` | `exportPromptFile` | API `POST /api/prompt-files/export` | `CreationOtherPanel` |
| `useImportPromptFile` | `importPromptFile` | API `POST /api/prompt-files/import` | `MinaBlock` |

## Service helpers no hook calls directly

| Function | File | Does | Called by |
|---|---|---|---|
| `supabase` | [services/supabase.client.ts](../src/services/supabase.client.ts) | the one Supabase client, made with the anon key | every service that hits Supabase |
| `apiPost`, `apiDelete` | [services/api.client.ts](../src/services/api.client.ts) | calls the backend with the user's token | every service that hits the API |
| `saveBlob` | [services/generations.service.ts](../src/services/generations.service.ts) | saves a blob as a file download | `downloadMedia`, `exportPromptFile` |
| `forgetAccount` | [services/accounts.service.ts](../src/services/accounts.service.ts) | removes an account from `mina-accounts` | `switchAccount` (when the saved session has expired), `signOutCurrentAccount` |

## Hooks with no network call

| Hook | Does | Used by |
|---|---|---|
| `useLongPress` | tells a hold from a click (500 ms) | `AssetTiles`, `MinaBlockBrandMemoryPill`, `MinaBlockRatioPill` |
| `useDragMouse` | drag to reorder, with a small slop before a drag starts | `AssetTiles`, `MinaBlockUploadAndLibraries` |
| `useInView` | `IntersectionObserver`: is this element on screen? | `CreationCard`, `CreationMedia` |

## Every component, by folder

| Folder | Components |
|---|---|
| `components/` | `AccountMenu`, `AppFooter`, `AutoMatchaPanel`, `Carousel`, `CreationCard`, `CreationFullScreen`, `CreationMedia`, `CreationOtherPanel`, `CreationSkeleton`, `GlassDisc`, `LegalPanel`, `LoginPanel`, `Markdown`, `MatchaPanel`, `RoleTagCard`, `TutorialPanel`, `VideoPlayer` |
| `components/studio/` | `MinaBlock`, `MinaBlockBrandMemoryPill`, `MinaBlockMinaBrief`, `MinaBlockPillsAnimate`, `MinaBlockPillsCreate`, `MinaBlockRatioPill`, `MinaBlockUploadAndLibraries`, `MinaBlockUserBrief`, `RightStudioPanel` |
| `components/studioLibrary/` | `StudioLibrary`, `SceneLibrary`, `ContentCreatorLibrary` |
| `components/brandMemory/` | `BrandMemoryBar`, `BrandingAssetsPanel` |
| `components/builder/` | `Table` (with `Row`, `Rule`, `Group`), `AssetTiles`, `MatchaSlider` |

Which page uses which component is drawn in each page's doc: [home](pages/home.md), [studio](pages/studio.md), [profile](pages/profile.md), [auth callback](pages/auth-callback.md).
