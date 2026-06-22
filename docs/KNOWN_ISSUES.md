# Known Issues

This file captures issues found while scanning the project. They are useful context before adding larger features.

## Current `bun run check` Result

`bun run check` currently passes:

- 0 errors
- 0 warnings

## Highest-Value Fixes

These old check failures have been fixed:

- Convex `Id` imports were cleaned up.
- `bids.matchId` now uses `v.id('matches')`.
- `/auctions/[matchId]` casts the route param once and uses typed helpers.
- `players.getAll` returns a consistent shape with `stats: []`.
- The players page handles players without stats.
- The auction page has guards for missing loaded data, selected players, bids, and stats.
- `$inspect` debug calls were removed from the touched components.
- The auction access key label is associated with its input.

## Remaining Cleanup

The app now type-checks, but some architectural risks remain before bigger features.

## Auction Logic Risks

These are separate from TypeScript diagnostics but matter for feature work:

- Permission checks are client-side only.
- Server mutations do not fully enforce auction state, budget, team capacity, or role permissions.
- The page assumes exactly two teams.
- Auction detail is still a large component and would benefit from smaller panels/helpers.

## Suggested Order Before Major Features

1. Add server-side validation in bid and auction mutations.
2. Introduce a real role/auth model if access moves beyond trusted friends.
3. Extract auction calculations into shared helpers.
4. Split the auction detail page into smaller components.
5. Add empty/loading/error states across all Convex-backed pages.
