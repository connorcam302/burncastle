# Auction Flow

The live auction screen is `src/routes/auctions/[matchId]/+page.svelte`.

## Roles

The page uses a simple local access key flow.

1. User clicks the key icon.
2. User enters a value.
3. The page checks whether the value matches a Convex player ID.
4. If valid, it saves the value to `localStorage.userId`.

Permissions are inferred from `userId`:

- Captain: `userId` matches either team's `captainId`.
- Auctioneer: `userId` is included in `auction.auctioneers`.
- Viewer: any other visitor.

There is no server-side authentication or authorization yet.

## Auctioneer Actions

Auctioneers can:

- Select a displayed player.
- Clear the displayed player.
- Mark the current highest bid as the winner.
- Unmark the current highest bid as the winner.
- Open the auction.
- Close the auction.

These actions call Convex mutations:

- `api.auctions.setDisplayedPlayer`
- `api.auctions.setAuction`
- `api.bids.markWinningBid`
- `api.bids.unmarkWinningBid`

## Captain Actions

Captains can submit bids when:

- The auction is live.
- A displayed player is selected.
- The bid is greater than the current highest bid.
- Their team has enough remaining funds.
- Their team is not full.

The bid mutation is:

```ts
api.bids.newBid
```

## Bidding Rules In Code

Starting budget:

```ts
(participants.length - 2) * 25
```

The `- 2` reflects two captains who are already assigned.

Current spend:

- Sum winning bids where `bidderId` equals the team's `captainId`.

Team full condition:

```ts
team.playerIds.length === participants.length / 2
```

Highest bid:

- `api.bids.getOnePlayer` returns bids for a match and player, sorted by descending amount.
- The UI treats `bids[0]` as the current highest bid.

Winning a bid:

1. Auctioneer clicks "Mark Bid As Winner".
2. `api.bids.markWinningBid` patches the bid with `winningBid: true`.
3. The mutation finds the team where `captainId` equals the bid's `bidderId`.
4. The player is appended to that team's `playerIds`.

Undoing a winning bid:

1. Auctioneer clicks "Unmark Bid As Winner".
2. `api.bids.unmarkWinningBid` patches the bid with `winningBid: false`.
3. The player is removed from the bidder's team.

## Display States

Center panel states:

- Auction closed: shows "Auction Closed".
- Auction live with no displayed player: asks users to wait.
- Auction live with displayed player: shows player card, current bid, and historical breakdown.
- Sold bid: overlays "SOLD" on the player card when the top bid is marked as winning.

Side panels:

- Show each team name, captain image, budget, current roster, prices, and price changes versus the previous Burncastle.

Remaining players:

- Derived from match participants minus both teams' player IDs and the currently displayed player.

## Known Risks Before Adding Features

- The page assumes two teams with indexes `teams[0]` and `teams[1]`.
- There are many places where missing stats or missing images can break rendering.
- Permissions are client-side only.
- `newBid` blocks new bids after any winning bid exists for that player, but does not enforce auction `live` status server-side.
- Bid validation is split between frontend checks and mutation checks.
- Auction detail is a large component; feature work may be easier after extracting panels or domain helpers.
