# AWS Learning App

A tiny Node.js (Express) server for learning AWS hands-on.

| Endpoint | Source |
|---|---|
| `GET /health` | Shows which DBs are configured |
| `GET /api/hello` | Hardcoded data |
| `GET /api/books` | SQL (Postgres) `books` table |
| `GET /api/movies` | NoSQL (DynamoDB) table |

The app always starts, even with no database. A DB-backed API returns `503` if its DB is not configured or not reachable.

## Run

```bash
cd simple-node-server
npm install
cp .env.example .env   # fill in only what you have
npm start              # .env is loaded automatically
```

## Postgres setup
Run `schema.sql` against your database to create and seed the `books` table.

## DynamoDB setup
Create a table (partition key `id`, String) and put a few items with attributes like `title` and `year`.
