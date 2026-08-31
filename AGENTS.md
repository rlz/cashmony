# Cashmony contributor guide

## Repository map

- `engine/`: core finance domain and computed statistics. Keep business rules here rather than duplicating them in UI components or storage adapters.
- `front/`: React UI. Screens live in `front/screens/`; shared UI belongs in `front/widgets/`.
- `localstorage/`: browser-side IndexedDB persistence.
- `api/` and `common/`: versioned server API client and shared Zod schemas/conversions.
- `backend/`: Fastify routes, management functions, and MongoDB persistence.
- `currencies/`: currency definitions and utilities.
- `tools/`: operational scripts. Treat backup, restore, and deployment operations as production-affecting.

## Commands

```sh
npm run start-client      # Vite client, port 3000
npm run start-server      # Fastify backend via tsx
npm run build-client      # output: front/dist/
npm run build-server      # output: dist/
npm test                  # Vitest
npm run parser            # regenerate generated PEG parser
npx eslint .
```

Run focused tests while editing the engine, then run `npm test` before handoff. Run `npm run build-client` for UI or client-build changes and `npm run build-server` for backend/build-tool changes.

## Code conventions

- Use TypeScript and ESM imports with explicit `.js` extensions for local runtime imports, matching nearby files.
- Follow ESLint: four-space indentation, single quotes, no semicolons, sorted imports, and no floating promises.
- Keep types strict; do not weaken typing with `any` to bypass a model or API mismatch.
- Favor immutable `readonly` domain structures and preserve the existing date handling with Luxon `DateTime<true>`.
- Put reusable business logic in `engine/`; keep React components focused on rendering and interaction.
- Keep UI routing additions in `front/App.tsx` and match existing nested screen/widget organization.

## Synchronization and persistence

Operations, accounts, categories, and watches synchronize independently through versioned `/api/v0` endpoints. A schema change usually spans:

1. `engine/model.ts` and/or engine behavior;
2. `common/data_v0.ts` conversions and Zod schemas;
3. `api/api.ts` client calls;
4. `localstorage/` persistence and synchronization code; and
5. `backend/sync.ts` plus `backend/storage/`.

Preserve tombstones and `lastModified` semantics. Do not make a server-only or client-only model change that breaks synchronization compatibility.

## Generated and operational files

- Edit `engine/filterExpressionParser/parser.peggy`, then run `npm run parser`; do not hand-edit `parser.gen.js`.
- Do not edit build output in `dist/` or `front/dist/`.
- `deploy.sh`, `tools/backup.ts`, and `tools/restore.ts` target remote infrastructure and may replace production data. Do not run or alter them casually; use `restore --drop` only with explicit intent.
- Keep credentials, private keys, authentication material, and backup data out of commits.

## Validation checklist

- Regenerate the parser if its grammar changed and include the generated output.
- Run relevant tests; add regression coverage for engine or filter behavior changes.
- Run ESLint on changed code and preserve import ordering.
- Build the affected client/server artifact before handoff when practical.
