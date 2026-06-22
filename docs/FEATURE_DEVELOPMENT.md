# Feature Development Notes

Use this as a starting checklist before adding new Burncastle features.

## Before You Build

1. Decide whether the feature is display-only, match data, auction data, or player stats.
2. Check whether Convex schema changes are needed.
3. If schema changes are needed, update `src/convex/schema.ts` first.
4. Regenerate Convex generated files with the Convex CLI.
5. Add or update queries/mutations in `src/convex`.
6. Keep client UI validation for good UX, but enforce important rules in Convex mutations too.

## Common Feature Areas

### Player Features

Likely files:

- `src/routes/players/+page.svelte`
- `src/lib/components/PlayerCard.svelte`
- `src/lib/components/PlayerView.svelte`
- `src/convex/players.ts`
- `src/convex/schema.ts`

Watch for:

- Players without stats.
- Players without matching images.
- `breakdown` JSON shape differences between outfield players and goalkeepers.

### Auction Features

Likely files:

- `src/routes/auctions/+page.svelte`
- `src/routes/auctions/[matchId]/+page.svelte`
- `src/convex/auctions.ts`
- `src/convex/bids.ts`
- `src/convex/schema.ts`

Watch for:

- Two-team assumptions.
- Client-only permission checks.
- Budget and roster-size rules.
- Winning bid idempotency.
- Server-side validation of auction state.

### Match Features

Likely files:

- `src/routes/matches/+page.svelte`
- `src/routes/matches/[matchId]/+page.svelte`
- `src/lib/components/MatchRow.svelte`
- `src/convex/matches.ts`
- `src/convex/schema.ts`

The matches page now lists existing Burncastles and includes an editor for creating or updating match results, team data, participants, player card stats, and event timelines. Player-page goals and assists are derived from `matchEvents`, with old `stats` values as fallback.

### Gallery Features

Likely files:

- `src/routes/gallery/+page.svelte`
- `static/*`

The route exists but needs product decisions about where images live, how they are grouped, and whether uploads are needed.

## Recommended Cleanup Before Big Features

These are not required for every small change, but they will make bigger work easier:

- Add server-side validation to bid and auction mutations.
- Extract auction UI into smaller components.
- Add helpers for auction calculations: budget, spend, team fullness, current bid, remaining players.
- Add empty/loading/error states for Convex queries.
- Decide on a real auth/admin model if this will be used outside the friend group.

## Quality Checks

Run these after code changes:

```sh
bun run check
bun run lint
bun run build
```

For UI changes, also open the affected page locally and check:

- Desktop layout.
- Mobile layout.
- Loading states.
- Missing data states.
- Actions that mutate Convex data.

## Data Safety

Auction and stats features change shared match history. Before adding mutations that edit existing rows:

- Prefer narrow mutations with explicit arguments.
- Validate IDs and ownership/permissions in the mutation.
- Avoid deleting historical bids unless the feature is explicitly about cleanup.
- Prefer patching reversible flags over destructive changes.
- Consider adding a timestamp or actor field for auditability if edits become common.
