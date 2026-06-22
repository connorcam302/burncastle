# Data Model

The Convex schema is defined in `src/convex/schema.ts`.

## Tables

### `players`

Represents a person who can appear in matches and auctions.

Fields:

- `nameId: string` - stable slug used for static image filenames.
- `name: string` - display name.
- `nickname?: string`
- `email?: string`

Asset convention:

```text
static/players/{nameId}.png
```

### `matches`

Represents a Burncastle match.

Fields:

- `order: number` - Burncastle match number, used for sorting and labels.
- `hasAuction: boolean` - whether this match appears in auction pages.
- `participants: Id<'players'>[]` - players eligible for the match or auction.

Indexes:

- `order`
- `hasAuction`

### `auctions`

Represents live auction state for a match.

Fields:

- `matchId: Id<'matches'>`
- `live: boolean`
- `auctioneers?: Id<'players'>[]`
- `displayedPlayerId: Id<'players'> | null`

Indexes:

- `matchId`

### `teams`

Represents a team in a match.

Fields:

- `matchId: Id<'matches'>`
- `score: number`
- `name: string`
- `playerIds: Id<'players'>[]`
- `captainId: Id<'players'>`
- `teamColour?: string`

Indexes:

- `matchId`
- `captainId_matchId`

Current UI assumptions:

- Auction pages assume exactly two teams.
- Each team has one captain.
- Captains are also present in `playerIds`.

### `stats`

Represents one player's stats for one match.

Fields:

- `matchId: Id<'matches'>`
- `playerId: Id<'players'>`
- `goals: number`
- `assists: number`
- `isCaptain: boolean`
- `rating: number`
- `position: string`
- `breakdown: string`

Indexes:

- `playerId`

`breakdown` is stored as JSON text and parsed in components. Outfield players and goalkeepers use different keys.

Outfield-style keys currently expected by `PlayerCard.svelte`:

- `pace`
- `shooting`
- `passing`
- `dribbling`
- `defending`
- `physical`

Goalkeeper-style keys currently expected:

- `diving`
- `handling`
- `kicking`
- `reflexes`
- `speed`
- `positioning`

### `matchEvents`

Represents timeline events for a match.

Fields:

- `matchId: Id<'matches'>`
- `teamId?: Id<'teams'>`
- `playerId?: Id<'players'>`
- `assistPlayerId?: Id<'players'>`
- `type: string`
- `minute: number`
- `note?: string`

Indexes:

- `matchId`
- `playerId`
- `assistPlayerId`

Current event types used by the matches page:

- `goal`
- `yellow_card`
- `red_card`
- `penalty`
- `position_change`
- `break`
- `note`

### `bids`

Represents a bid for a player in an auction.

Fields:

- `matchId: string`
- `playerId: Id<'players'>`
- `bidderId: Id<'players'>`
- `winningBid: boolean`
- `amount: number`
- `timestamp: number`

Indexes:

- `matchId`
- `playerId`
- `matchId_playerId_winningBid`
- `matchId_playerId`

## Derived Data

The app derives a lot of display data in queries and components rather than storing it separately.

Examples:

- Player prices come from winning bids.
- Team spend is the sum of winning bids by captain.
- Remaining budget is `(participants.length - 2) * 25 - spend`.
- Player history is built by combining `stats`, `matches`, and winning bid prices.

## Creation Checklist For New Match With Auction

To create a fully usable auction match, data needs to exist in this shape:

1. `players` rows for every participant.
2. Matching `static/players/{nameId}.png` images.
3. One `matches` row with `hasAuction: true`.
4. One `auctions` row linked to the match.
5. Two `teams` rows linked to the match, each with a captain.
6. `stats` rows if players should show historical ratings/cards.

Player queries now return a consistent `stats: []` shape, but the UI only renders player cards when at least one stats entry exists.

## Result Entry

The `/matches` page can create and update:

- `matches.order`
- `matches.hasAuction`
- `matches.participants`
- two `teams` rows with names, scores, colours, captains, and rosters
- one `stats` row per selected participant for card/rating data
- `matchEvents` rows for goals, assists, cards, penalties, and notes

Saving a match recreates the event timeline and derives player goals/assists from `goal` events. `api.players.getAll` also prefers event-derived goals and assists, while keeping old stat-row values as fallback for historical data that has not been converted yet.
