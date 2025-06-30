# SmashKarts - Full Stack Application

This repository contains a full-stack application with a Next.js frontend and a WebSocket backend for real-time auction functionality.

## Project Structure

- `smashkarts-ui/` - Next.js frontend application
- `smashkarts-websocket/` - WebSocket backend for real-time features

## Docker Compose Setup

The project includes a Docker Compose configuration that builds and runs both services together.

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- PostgreSQL database running (either locally or in cloud)

### Environment Variables

**Important Security Note**: Environment variables are provided at runtime and build-time as needed. Sensitive data is NOT embedded in the Docker images for security reasons.

Create a `.env` file in the root directory (same level as `docker-compose.yml`) with the following variables:

```env
# Database Configuration
# For Docker containers to access PostgreSQL on host machine:
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/smashkarts

# Database password (used by the start-database.sh script)
DB_PASSWORD=password

# Better Auth Configuration (replaces NextAuth)
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# WebSocket Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SYNC_SERVER_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

#### Option 1: Local PostgreSQL (Recommended for Development)

1. **Start the local database:**

   ```bash
   cd smashkarts-ui
   ./start-database.sh
   ```

2. **Use the standard Docker Compose:**
   ```bash
   docker-compose up --build
   ```

#### Option 2: Host Network Mode (Linux Alternative)

If you're on Linux and `host.docker.internal` doesn't work:

1. **Start the local database:**

   ```bash
   cd smashkarts-ui
   ./start-database.sh
   ```

2. **Use host network mode:**
   ```bash
   docker-compose -f docker-compose.host-network.yml up --build
   ```

#### Option 3: Cloud Database

For production, update your `DATABASE_URL` to point to your cloud PostgreSQL instance.

### How Environment Variables Work

1. **Docker Compose automatically reads** the `.env` file in the same directory as `docker-compose.yml`
2. **Build-time variables** are passed to Next.js during the build process (required for compilation)
3. **Runtime variables** are passed to containers at runtime via the `env_file` directive
4. **No sensitive data is embedded** in the Docker images
5. **Each service gets its own environment** with the variables it needs

### Running the Application

1. **Build and start all services:**

   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode:**

   ```bash
   docker-compose up -d --build
   ```

3. **Stop all services:**

   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

### Services

- **nextjs-docker** (Port 3000): Next.js frontend application
- **socket-docker** (Port 3001): WebSocket backend for real-time features

### Network Configuration

Both services are connected through a custom bridge network (`smashkarts-network`) allowing them to communicate with each other using service names as hostnames.

### Development

For development, you can run the services individually:

- Next.js: `cd smashkarts-ui && npm run dev`
- WebSocket: `cd smashkarts-websocket && npm run dev`

## API Endpoints

### WebSocket Server (Port 3001)

- `POST /create-auction/:auctionSlug` - Create a new auction
- `GET /check-auction/:auctionSlug` - Check if auction exists
- `POST /restart-auction/:auctionSlug` - Restart auction if it doesn't exist
- `GET /active-auctions` - Get all active auctions

## Security Considerations

- ✅ Environment variables are provided at build-time and runtime as needed
- ✅ No sensitive data is embedded in Docker images
- ✅ `.dockerignore` files prevent `.env` files from being copied
- ✅ Services communicate over internal Docker network
- ✅ Build arguments are used only during build process

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request
