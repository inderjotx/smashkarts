import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { AuctionManager } from "./auction.js";
import { SyncServer } from "./sync-server.js";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Get configuration from environment variables
const PORT = process.env.PORT || 3001;
const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || "http://localhost:3000";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Add CORS middleware for HTTP endpoints
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Add JSON parsing middleware
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
const syncServer = new SyncServer(SYNC_SERVER_URL); // provide nextjs server url

const auctionManager = new AuctionManager(io, syncServer);


io.on("connection", (socket) => {
  console.log("a user connected");
});


app.post("/create-auction/:auctionSlug", (req, res) => {
  const { auctionSlug } = req.params;
  auctionManager.createAuction(auctionSlug);
  res.json({ auctionSlug });
});

// Endpoint to check if auction namespace exists
app.get("/check-auction/:auctionSlug", (req, res) => {
  const { auctionSlug } = req.params;

  try {
    const exists = auctionManager.doesAuctionExist(auctionSlug);
    const auctionState = auctionManager.getAuctionState(auctionSlug);

    res.json({
      exists,
      auctionState: exists ? auctionState : null,
      message: exists ? "Auction exists" : "Auction does not exist"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check auction status",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Endpoint to restart/rebuild auction if it doesn't exist
app.post("/restart-auction/:auctionSlug", (req, res) => {
  const { auctionSlug } = req.params;

  try {
    const exists = auctionManager.doesAuctionExist(auctionSlug);

    if (exists) {
      res.json({
        success: false,
        message: "Auction already exists, no need to restart"
      });
      return;
    }

    // Create the auction
    auctionManager.createAuction(auctionSlug);

    res.json({
      success: true,
      auctionSlug,
      message: "Auction restarted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to restart auction",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Endpoint to get all active auctions
app.get("/active-auctions", (req, res) => {
  try {
    const activeAuctions = auctionManager.getAllActiveAuctions();
    res.json({
      activeAuctions,
      count: activeAuctions.length
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get active auctions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Sync server URL: ${SYNC_SERVER_URL}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});

