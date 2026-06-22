# Burncastle

Burncastle is a private football website for organising and reviewing matches with friends. The core idea is:

1. Create a Burncastle match with participating players.
2. Run an auction where captains bid for players.
3. Lock winning bids into teams.
4. Use the same data later for player cards, prices, goals, assists, ratings, and match history.

The app is built with SvelteKit, Svelte 5, Tailwind CSS 4, and Convex.

## Quick Start

Install dependencies:

```sh
bun install
```

Create a local environment file:

```sh
cp .env.example .env.local
```

Set:

```sh
PUBLIC_CONVEX_URL=your_convex_deployment_url
```

Run the frontend:

```sh
bun run dev
```

Run Convex development in a second terminal when changing backend functions or schema:

```sh
bunx convex dev
```

## Useful Commands

```sh
bun run check
bun run lint
bun run format
bun run build
```

## Main Pages

- `/` - homepage tiles for matches, auctions, players, and gallery.
- `/auctions` - list of matches that have auctions.
- `/auctions/[matchId]` - live auction room for a single match.
- `/players` - searchable player cards and historical stats.
- `/matches` - match archive plus create/edit workflow for results, teams, participants, player cards, and timeline events.
- `/matches/[matchId]` - read-only match view with score, lineups, player cards, and event timeline.
- `/gallery` - currently present as a route, but not yet implemented.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data Model](docs/DATA_MODEL.md)
- [Auction Flow](docs/AUCTION_FLOW.md)
- [Feature Development Notes](docs/FEATURE_DEVELOPMENT.md)
- [Known Issues](docs/KNOWN_ISSUES.md)

## Important Conventions

- Convex functions live in `src/convex`.
- The Convex functions path is configured in `convex.json`.
- Static player images are served from `static/players`.
- Player image filenames must match `players.nameId`, for example `/players/connor.png`.
- The root layout initializes Convex with `PUBLIC_CONVEX_URL`.
- The auction detail page uses browser-only behavior and sets `ssr = false`.
- Match results are created from `/matches` through `api.matches.save`.
- Goals, assists, cards, penalties, and notes are stored as `matchEvents`, which also power future match timelines.
- For self-hosted Convex CLI pushes, use `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY`; do not set `CONVEX_DEPLOYMENT` at the same time.

## Current Caveats

- There is no formal authentication yet. Auction permissions use a player ID saved in `localStorage` as `userId`.
- Some data assumptions are hard-coded for two teams and two captains.
- Some pages are placeholders or incomplete, especially matches and gallery.
