# Project Context

## Overview

This is `api2spec-fixture-express`, a fixture API for testing the api2spec tool. It's a Tea Brewing API built with Express.js and TypeScript, using Zod for validation.

## Tech Stack

- **Package Manager**: pnpm
- **Runtime**: Node.js 20+ or Bun
- **Framework**: Express 4.x
- **Validation**: Zod
- **Testing**: Vitest + Supertest
- **TypeScript**: ESM modules

## Key Commands

```bash
pnpm dev          # Dev server with hot reload
pnpm test         # Run all tests
pnpm test:watch   # Tests in watch mode
pnpm build        # TypeScript compilation
```

## Architecture

- **In-memory storage**: Data stored in Map objects (no database)
- **Zod schemas**: Source of truth for all request/response types
- **Express Router**: Modular route organization

## File Locations

| Type | Location |
|------|----------|
| Schemas | `src/schemas/*.ts` |
| Routes | `src/routes/*.ts` |
| Tests | `src/routes/*.test.ts` |
| App factory | `src/app.ts` |
| Entry point | `src/index.ts` |

## API Conventions

- **List endpoints**: Return `{ data: [], pagination: { page, limit, total, totalPages } }`
- **Create**: Returns 201 with created entity
- **Delete**: Returns 204 (no content)
- **Errors**: Return `{ code, message, details? }` with 400/404
- **PUT**: Requires all fields (full replacement)
- **PATCH**: All fields optional (partial update)

## TIF Compliance

The `/brew` endpoint returns HTTP 418 "I'm a teapot" as the TIF signature.

## Testing

119 tests covering all endpoints. Tests use supertest with the app factory from `src/app.ts`.
