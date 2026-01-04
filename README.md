# api2spec-fixture-express

Express.js fixture API for api2spec testing. A TIF-compliant Tea Brewing API.

## Quick Start

```bash
pnpm install
pnpm dev
```

Server runs at http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm build` | TypeScript compilation |

## API Endpoints

### Resources

| Resource | Endpoints |
|----------|-----------|
| Teapots | `GET/POST /teapots`, `GET/PUT/PATCH/DELETE /teapots/:id` |
| Teas | `GET/POST /teas`, `GET/PUT/PATCH/DELETE /teas/:id` |
| Brews | `GET/POST /brews`, `GET/PATCH/DELETE /brews/:id` |
| Steeps | `GET/POST /brews/:brewId/steeps` |

### Health & TIF

| Endpoint | Status | Description |
|----------|--------|-------------|
| `GET /health` | 200 | Health check |
| `GET /health/live` | 200 | Liveness probe |
| `GET /health/ready` | 200/503 | Readiness probe |
| `GET /brew` | **418** | TIF signature |

## Tech Stack

- **Runtime**: Node.js 20+ / Bun
- **Framework**: Express 4.x
- **Validation**: Zod
- **Testing**: Vitest + Supertest
- **Language**: TypeScript (ESM)

## Project Structure

```
src/
├── index.ts          # Entry point
├── app.ts            # Express app factory
├── routes/           # Route handlers
│   ├── teapots.ts
│   ├── teas.ts
│   ├── brews.ts
│   └── health.ts
└── schemas/          # Zod schemas
    ├── common.ts
    ├── teapot.ts
    ├── tea.ts
    ├── brew.ts
    └── steep.ts
```

## License

MIT
