# Super Owner Multi-Gym Management — Implementation Plan

Extends the existing Super Owner system. No rebuild — all existing files, RBAC, demo mode, and the current dashboard remain intact. New functionality is layered on top.

---

## 1. Data layer (mockDb.ts)

Add a new permission table without touching existing ones:

```
super_owner_permissions: {
  id, super_owner_id, vendor_id,
  modules: { dashboard, analytics, members, payments, leads,
             expenses, trainers, plans, website, settings },
  allow_full_owner_view: boolean
}
```

New `dataService` helpers (delegated through demo + mock paths exactly like existing patterns):
- `getSuperOwnerPermissions(superOwnerId)` — returns rows for that SO across all assigned gyms; auto-seeds defaults from `super_owner_access`.
- `updateSuperOwnerPermission(superOwnerId, vendorId, patch)`
- `canSuperOwnerAccess(superOwnerId, vendorId, module)` — pure helper.

Auto-default rule: when a gym is assigned (`assignGymToSuperOwner`), create a permission row with all modules = true, `allow_full_owner_view = true` (full access by default; admin can restrict later).

## 2. SessionContext extension

Add Owner-View mode without disturbing existing behavior:

```ts
// new fields
superOwnerActiveVendorId: string | null;
enterGymAsSuperOwner(vendorId: string): void;
exitGymView(): void;
```

- Persisted in `localStorage` key `gymos_super_owner_active_vendor`.
- When set AND `role === 'super_owner'`: `vendorId` getter returns this value, so all existing vendor-scoped queries automatically filter to the chosen gym — zero changes needed in members/payments/leads/etc. pages.
- `exitGymView()` clears it and returns SO to the central dashboard.

## 3. Permission enforcement utility

`src/utils/superOwnerAccess.ts`:
```ts
export function canSuperOwnerAccess(user, vendorId, module): boolean
```
Reads from cached permission rows. Returns `true` for non-super-owners (no-op).

Used by:
- `AppSidebar` — filter nav items when in Owner-View
- `ProtectedRoute` — block routes when module disabled
- Action buttons on pages (hide create/edit when restricted)

## 4. Super Admin control page

Update `SuperOwnersAdminPage.tsx`:
- Add **"Manage Access"** button per assigned gym row inside the existing dialog.
- New nested dialog `SuperOwnerPermissionDialog`:
  - Toggle: Gym access (revokes if off)
  - Toggle: Allow full Owner View
  - 10 module switches in a responsive grid
  - Saves through `updateSuperOwnerPermission`; React Query invalidates.

## 5. Super Owner dashboard enhancement

Extend `SuperOwnerDashboard.tsx` (don't replace):
- Each gym card in the per-gym table grows a **"Quick Access"** row with buttons: Open Dashboard / Members / Payments / Analytics — each calling `enterGymAsSuperOwner(vendorId)` then navigating to the route. Disabled+tooltip when blocked by permissions.
- Permission badge column: "Full Access" / "Limited" / "Analytics Only" (computed from permission row).
- Trainer count + PT revenue added to per-gym row (already available via existing analytics).
- KPI strip gains: Growth %, Collection rate, Conversion rate, PT revenue (computed from existing `getAnalytics` results — no new aggregation).
- New charts row (reusing `RevenueChart` style components):
  - Member growth (line)
  - Payment collection (stacked bar: paid vs pending)
  - Gym revenue comparison (already present)

## 6. Owner-View entry banner

New small component `SuperOwnerViewBanner.tsx` rendered in `DashboardLayout` header when `superOwnerActiveVendorId` is set:
> "Viewing **Gym X** as Owner · [Exit Owner View]"

Sticky, dismissible only via Exit.

## 7. Dynamic sidebar

`AppSidebar.tsx`:
- When `role === 'super_owner'` and Owner-View active: filter items via `canSuperOwnerAccess(user, vendorId, module)`.
- When not in Owner-View: only show "Super Owner Dashboard" + "Settings" (current behavior).

## 8. Demo data

In `seedDemoData.ts` add `super_owner_permissions` array with the requested presets:
- SO1 → Gym1 full, Gym2 analytics-only, Gym3 members+payments+dashboard
- SO2 → Gym4 full, Gym5 limited (dashboard+analytics+members)

Loaded automatically by existing `seedAdapter`.

## 9. Persistence

`localStorage` keys (new):
- `gymos_super_owner_active_vendor`
- `gymos_super_owner_permissions` (demo mode)

Hydrated on mount in `SessionContext` + `demoStore`.

## 10. Mobile responsiveness

- Permission modal: grid `grid-cols-1 sm:grid-cols-2` for toggles.
- Quick access buttons: `flex-wrap`.
- Charts: `ResponsiveContainer` (already used).
- KPI strip: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.

---

## Files to create
- `src/utils/superOwnerAccess.ts`
- `src/components/super-owner/SuperOwnerPermissionDialog.tsx`
- `src/components/super-owner/SuperOwnerViewBanner.tsx`

## Files to edit
- `src/data/mockDb.ts` — new table + CRUD
- `src/data/seedDemoData.ts` — permission presets
- `src/services/dataService.ts` — new helpers + delegation
- `src/demo/demoDataService.ts` — demo path
- `src/demo/storage.ts` — new key
- `src/contexts/SessionContext.tsx` — Owner-View state
- `src/pages/SuperOwnersAdminPage.tsx` — Manage Access button
- `src/pages/SuperOwnerDashboard.tsx` — quick access + KPIs + charts
- `src/components/layout/AppSidebar.tsx` — dynamic filtering
- `src/components/layout/DashboardLayout.tsx` — mount banner
- `src/components/layout/ProtectedRoute.tsx` — module gating

## Out of scope (kept unchanged)
- Existing owner/employee RBAC, demo mode toggle, vendor switcher, mockDb existing tables, all module pages' internal logic.

Approve to proceed with implementation.