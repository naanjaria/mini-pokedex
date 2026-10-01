# Mini Pokédex

A small Angular 21 app for browsing Pokémon, comparing their stats,
and building teams of up to six Pokémon.

The app has two tabs: Pokémon and Teams. Pokémon details open in a
side panel, while the team builder opens in a modal.

## Setup

You’ll need Node.js 24.x and npm. Internet access is required to load
Pokémon data.

Clone the repository and open a terminal in the project folder.

Install dependencies:

```bash
npm ci
```

Start the mock GraphQL server:

```bash
npx json-graphql-server db.js --port 4000
```

In a second terminal, start Angular:

```bash
npm start
```

Open http://localhost:4200.

Keep both terminals running:

| Server | Address |
| --- | --- |
| Angular app | http://localhost:4200 |
| Mock GraphQL server | http://localhost:4000 |

On Windows, if PowerShell blocks npm scripts, use `npm.cmd` and
`npx.cmd` instead of `npm` and `npx`.

## Features

### Pokémon

The table displays sprites, names, types, six base stats, and total
stats. You can:

- Search by name, with a 300 ms debounce
- Filter by type
- Sort by any base stat or total
- Choose 10, 25, or 50 rows per page
- Open a detail panel with abilities and an animated radar chart

### Teams

The Teams tab lists the saved teams. The Create team button opens
a reactive form where you can enter a name and choose Pokémon.

Team names are required, must contain 3–30 characters, and are checked
against existing teams using a debounced async validator. Validation
messages appear after editing, touching a field, or attempting to submit.

The Pokémon picker searches the cached list and displays up to ten
matching suggestions. Selections appear as removable chips, with
a minimum of one and a maximum of six Pokémon.

Creation and deletion use optimistic updates. Changes appear immediately
and are rolled back if the server request fails.

New teams use trainer ID 1, Ash Ketchum, from the supplied sample data.
Authentication and trainer selection are outside this version’s scope.

### Selected team

Selecting a team shows its Pokémon, combined base-stat total, and type
distribution. These values are derived with computed().

The selected team ID is saved to localStorage using effect(), allowing
the selection to be restored after a refresh. Only the selection is
persisted in the browser; team records belong to the mock server.

Dual-type Pokémon contribute to both type counts.

### Optional bonus

Implemented bonus 4:

- Shimmering skeleton rows while Pokémon load
- Staggered entry animations for team rows
- Dismissible toast notifications for team mutation results

Notifications are visible inside the creation modal and on the page
when the modal is closed. Animations respect reduced-motion preferences.

## APIs

Pokémon data comes from the public GraphQL API:

https://beta.pokeapi.co/graphql/v1beta

Team queries and mutations use the local mock server:

http://localhost:4000

The mock server starts with the trainers and teams in `db.js`. Changes
are held in memory, so restarting it restores the sample data.

## Code organisation

The application is grouped by feature:

- `src/app/pokedex`: Pokémon models, queries, API service, store,
  selectors, table, and detail panel
- `src/app/teams`: team models, queries, API service, store, validators,
  builder, and list
- `src/app/common`: shared state/response models and API constants

Services return Observables and convert API responses into the models
used by the UI. They check GraphQL errors as well as HTTP failures.

The custom stores use BehaviorSubject. Pokémon selectors derive search
results, type filters, sorting, and pagination. Shared streams use
shareReplay.

Components are standalone and use OnPush, inject(), and signal-based
inputs and outputs. toSignal() connects store streams to templates.

## Loading and failures

The table, detail panel, team list, and Pokémon picker handle loading,
empty, error, and success states. Failed reads offer a Retry action.

PokéAPI calls retry twice, with delays of one and two seconds. Final
failures are shown as readable messages.

Team mutations run one at a time to keep rollback predictable.
A temporary team is inserted during creation and replaced with the
server response. Failed creation removes it; failed deletion restores
the previous list.

Mutations are not automatically retried because repeating a create
request could produce duplicate teams.

## Caching and offline limits

The Pokémon list is fetched in sequential API batches and cached
in memory. Search, filtering, sorting, pagination, and the Pokémon
picker use that cache.

These features can continue working if internet access drops after
loading. Opening Pokémon details requires a fresh API request.

Refreshing the browser clears the cache. Full offline support is
outside this version’s scope.

## Tests

Run the unit tests:

```bash
npm test -- --watch=false
```

The assessment tests cover:

- Rollback after optimistic team creation fails
- Debounced Pokémon search, type filtering, and stat sorting
- Async team-name uniqueness validation

The root component also has basic creation and router-outlet tests.
Tests use mocked data and do not require either server to run.

## Build

Create a production build:

```bash
npm run build
```

## Improvements with more time

- Make the UI more interactive, with clearer selection feedback,
  improved modal behavior, and better layouts on smaller screens
- Improve keyboard navigation in the Pokémon picker
- Show the first Pokémon batch sooner rather than waiting for the
  complete list
- Cache Pokémon details to avoid repeated requests
- Clear the team form after a successful save while keeping inputs
  when saving fails
- Add more component and end-to-end tests
- Replace the mock server with persistent storage