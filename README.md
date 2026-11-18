# GraphPulse

GraphPulse is a full-stack GraphQL IDE, interactive schema explorer, and query latency profiler.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- GraphQL.js execution engine
- Vercel Serverless Functions

## Development
```bash
npm install
npm run dev
```
The Vite frontend runs at http://localhost:5173. For the serverless GraphQL endpoint locally, use `npx vercel dev` (recommended). The UI gracefully reports when the API is unavailable.

## API
- `GET /api/graphql` — returns the active SDL schema.
- `POST /api/graphql` — executes `{ "query": "...", "variables": {} }`.
- Seed data includes users, projects, deployments, and logs. Supported mutations: `createProject` and `triggerDeployment`.

## Deploy to Vercel
Import this repository in Vercel. The project uses the Vite build output and deploys `api/graphql.ts` as a Node.js serverless function. No environment variables are required for the demo schema.

## Notes
The demo data and mutation state are in-memory and reset when a serverless instance is recycled. Connect a persistent database before using this as a production data store.
