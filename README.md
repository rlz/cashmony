# Cashmony

Cashmony is a personal-finance tracker. It supports accounts, categories, income, expenses, transfers, adjustments, tags, analytics, and spending goals. The browser app works as a progressive web app (PWA), keeps a local copy of the data, and synchronizes authenticated users' data with the server.

## Architecture

| Area | Purpose |
| --- | --- |
| `front/` | React 19 + Material UI browser application and PWA assets. Vite uses this directory as its root. |
| `engine/` | Domain model, stateful finance engine, filtering, sorting, and statistics reducers. |
| `localstorage/` | IndexedDB persistence adapter for client-side data. |
| `api/` and `common/` | Client API functions and shared versioned API schemas/data conversions. |
| `backend/` | Fastify server, authenticated synchronization endpoints, management routes, and MongoDB storage. |
| `currencies/` | Currency data and helpers. |
| `tools/` | Production server build plus backup and restore utilities. |

The server stores operations, accounts, categories, and watches (spending goals) in MongoDB, scoped by the authenticated user. The client synchronizes these resource types through `/api/v0/*` endpoints.

## Prerequisites

- Node.js compatible with the repository's dependencies (Node 18+ is a sensible baseline).
- MongoDB and the configuration required by `rlz-engine` when running the backend locally.

## Development

Install dependencies:

```sh
npm install
```

Run the client development server at `http://localhost:3000`:

```sh
npm run start-client
```

Run the backend in a separate terminal:

```sh
npm run start-server
```

## Commands

| Command | Description |
| --- | --- |
| `npm run start` / `npm run start-client` | Start Vite for the client. |
| `npm run start-server` | Run the Fastify backend with `tsx`. |
| `npm run build-client` | Build the client into `front/dist/`. |
| `npm run build-server` | Bundle the backend into `dist/`. |
| `npm test` | Run Jest tests. |
| `npm run test-coverage` | Run tests with coverage reporting. |
| `npm run parser` | Regenerate `engine/filterExpressionParser/parser.gen.js` from `parser.peggy`. |
| `npm run backup` | Create a MongoDB backup from the configured production host. |
| `npm run restore -- <backup-dir> <server> [--drop]` | Restore a backup to a server; `--drop` replaces existing collections. |

## Production deployment

`deploy.sh` builds both artifacts, copies the server bundle, systemd unit, TLS/auth directory, and client build to the `cashmony` host, then restarts the `cashmony` service. It assumes SSH access, the remote `/cashmony` directory, and the production credentials already exist. Review the script before running it.

## Testing and code quality

The project uses Vitest in Node mode. ESLint configuration lives in `eslint.config.js`; it enforces four-space indentation, single quotes, no semicolons, sorted imports, and no floating promises. There is no dedicated npm lint script, so invoke ESLint directly when needed:

```sh
npx eslint .
```

## Data model notes

Operations are immutable-shaped TypeScript objects with a `lastModified` timestamp. Supported operation kinds are:

- `expense` and `income`, each with one or more category allocations;
- `transfer`, with source and destination accounts;
- `adjustment`, for balance corrections; and
- `deleted`, a tombstone retained for synchronization.

Avoid changing the versioned schemas in `common/data_v0.ts` or sync routes without keeping client, server, local storage, and migration/compatibility behavior aligned.
