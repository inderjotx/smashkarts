# SmashKarts WebSocket Server

A Socket.IO server for handling real-time auction functionality in the SmashKarts application.

## Features

- Real-time auction management
- WebSocket connections for live updates
- REST API endpoints for auction operations
- CORS support for cross-origin requests
- Environment-based configuration

## Prerequisites

- Node.js 20 or higher
- pnpm package manager

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit the `.env` file with your configuration:

   ```env
   PORT=3001
   SYNC_SERVER_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

## Development

**Start development server:**

```bash
pnpm dev
```

This will start the server with hot reload using `tsx watch`.

## Building

**Build for production:**

```bash
pnpm build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Production

**Start production server:**

```bash
pnpm start
```

## Docker

**Build Docker image:**

```bash
docker build -t smashkarts-websocket .
```

**Run Docker container:**

```bash
docker run -p 3001:3001 --env-file .env smashkarts-websocket
```

## API Endpoints

- `POST /create-auction/:auctionSlug` - Create a new auction
- `GET /check-auction/:auctionSlug` - Check if auction exists and get state
- `POST /restart-auction/:auctionSlug` - Restart/rebuild auction if it doesn't exist
- `GET /active-auctions` - Get all active auctions

## Environment Variables

| Variable          | Description            | Default                 |
| ----------------- | ---------------------- | ----------------------- |
| `PORT`            | Server port            | `3001`                  |
| `SYNC_SERVER_URL` | URL of the sync server | `http://localhost:3000` |
| `CORS_ORIGIN`     | Allowed CORS origin    | `http://localhost:3000` |
| `NODE_ENV`        | Environment mode       | `development`           |

## Project Structure

```
smashkarts-websocket/
├── index.ts              # Main server file
├── auction.ts            # Auction manager
├── sync-server.ts        # Sync server integration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Docker configuration
├── .dockerignore         # Docker ignore file
├── .env                  # Environment variables (create from env.example)
└── README.md             # This file
```
