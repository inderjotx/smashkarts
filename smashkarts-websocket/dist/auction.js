export class AuctionManager {
    activeAuctions = new Map();
    auctionStates = new Map();
    io;
    participantManager;
    syncServer;
    constructor(io, syncServer) {
        this.io = io;
        this.participantManager = new ParticipantManager();
        this.syncServer = syncServer;
    }
    createAuction(auctionSlug) {
        if (this.activeAuctions.has(auctionSlug)) {
            console.log("Auction already exists");
            return auctionSlug;
        }
        const nspace = this.io.of(`/auction-${auctionSlug}`);
        console.log("auction created", `'${auctionSlug}'`);
        this.activeAuctions.set(auctionSlug, nspace);
        // Initialize auction state
        this.auctionStates.set(auctionSlug, {
            isActive: true,
            currentParticipantId: null,
            auctionStartTime: new Date(),
            soldParticipants: 0
        });
        this.setMiddleware(nspace, auctionSlug);
        this.setEventHandlers(nspace);
        return auctionSlug;
    }
    setMiddleware(nspace, auctionSlug) {
        nspace.use(async (socket, next) => {
            const cookies = socket.handshake.headers.cookie;
            const userRoleInfo = await this.syncServer.getUserRoleInfo(cookies, socket.id, auctionSlug);
            socket.userRoleInfo = userRoleInfo;
            next();
        });
    }
    setEventHandlers(nspace) {
        nspace.on("connection", (socket) => {
            console.log("a user connected to auction", nspace.name);
            console.log("user role info", socket.userRoleInfo);
            // Send current auction state to newly connected user
            this.sendCurrentAuctionState(socket, nspace.name);
            // Move event handlers to socket level instead of namespace level
            socket.on("client:startParticipantBidding", (data) => {
                console.log("starting bidding", data);
                console.log("user role info", socket.userRoleInfo);
                try {
                    // Check if user can manage auction (organizer, admin, or auctioneer)
                    if (!this.syncServer.canManageAuction(socket.userRoleInfo)) {
                        throw new Error("User does not have permission to manage auction");
                    }
                    let participant = this.participantManager.getParticipant(data.participantId);
                    console.log("starting bidding", data);
                    console.log("participant", participant);
                    if (!participant) {
                        // Handle null increment by providing a default value
                        const increment = data.increment ?? 100; // Default increment of 100
                        this.participantManager.addParticipant(data.auctionSlug, data.participantId, data.basePrice, increment, data.name, data.image, data.description, data.kd, data.gamesPlayed);
                        participant = this.participantManager.getParticipant(data.participantId);
                    }
                    // Update auction state
                    const auctionSlug = this.getAuctionSlugFromNamespace(nspace.name);
                    const auctionState = this.auctionStates.get(auctionSlug);
                    if (auctionState) {
                        auctionState.isActive = true;
                        auctionState.currentParticipantId = data.participantId;
                        auctionState.auctionStartTime = new Date();
                    }
                    nspace.emit("server:participantBiddingStarted", { participant: participant });
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log("error in startParticipantBidding", error);
                        nspace.emit("server:error", { error: error.message });
                    }
                    else {
                        console.log("error in startParticipantBidding", error);
                        nspace.emit("server:error", { error: "An unknown error occurred" });
                    }
                }
            });
            socket.on("client:bid", async (data) => {
                try {
                    // Check if user can bid (team captain or has auction management permissions)
                    if (!this.syncServer.canBid(socket.userRoleInfo)) {
                        throw new Error("User does not have permission to bid");
                    }
                    const participant = this.participantManager.getParticipant(data.participantId);
                    if (!participant) {
                        throw new Error("participant not found");
                    }
                    // Validate purse and team size before allowing bid
                    const teamData = await this.syncServer.getTeamPurse(data.teamId, participant.auctionSlug);
                    if (teamData === null) {
                        throw new Error("team not found");
                    }
                    // Check if team has reached maximum participants
                    if (teamData.currentTeamPlayers >= teamData.maxTeamParticipants) {
                        throw new Error("team has reached maximum number of participants");
                    }
                    // If it's a different team, they pay the full bid amount
                    if (data.amount > teamData.purse) {
                        throw new Error("bid amount exceeds team purse");
                    }
                    this.participantManager.addBid(data.participantId, { amount: data.amount, participantId: data.participantId, teamId: data.teamId });
                    nspace.emit("server:bid", { participant: participant });
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log("error in bid", error);
                        nspace.emit("server:error", { error: error.message });
                    }
                    else {
                        console.log("error in bid", error);
                        nspace.emit("server:error", { error: "An unknown error occurred" });
                    }
                }
            });
            socket.on("client:endParticipantBidding", async (data) => {
                try {
                    // Check if user can manage auction (organizer, admin, or auctioneer)
                    if (!this.syncServer.canManageAuction(socket.userRoleInfo)) {
                        throw new Error("User does not have permission to manage auction");
                    }
                    const participant = this.participantManager.getParticipant(data.participantId);
                    if (!participant) {
                        throw new Error("participant not found");
                    }
                    if (participant.currentBid == null) {
                        this.syncServer.markParticipantUnsold(participant);
                    }
                    participant.isSold = true;
                    participant.sellingBid = participant.currentBid;
                    await this.syncServer.markParticipantSold(participant);
                    // Update auction state
                    const auctionSlug = this.getAuctionSlugFromNamespace(nspace.name);
                    const auctionState = this.auctionStates.get(auctionSlug);
                    if (auctionState) {
                        auctionState.isActive = false;
                        auctionState.currentParticipantId = null;
                        auctionState.soldParticipants++;
                    }
                    nspace.emit("server:participantSold", { participant: participant });
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log("error in endParticipantBidding", error);
                        nspace.emit("server:error", { error: error.message });
                    }
                    else {
                        console.log("error in endParticipantBidding", error);
                        nspace.emit("server:error", { error: "An unknown error occurred" });
                    }
                }
            });
            socket.on("client:cancelParticipantBidding", async (data) => {
                try {
                    // Check if user can manage auction (organizer, admin, or auctioneer)
                    if (!this.syncServer.canManageAuction(socket.userRoleInfo)) {
                        throw new Error("User does not have permission to manage auction");
                    }
                    const participant = this.participantManager.getParticipant(data.participantId);
                    if (!participant) {
                        throw new Error("participant not found");
                    }
                    // Reset participant bidding information
                    participant.currentBid = null;
                    participant.biddingLogs = [];
                    participant.isSold = false;
                    participant.sellingBid = null;
                    // Update auction state
                    const auctionSlug = this.getAuctionSlugFromNamespace(nspace.name);
                    const auctionState = this.auctionStates.get(auctionSlug);
                    if (auctionState) {
                        auctionState.isActive = false;
                        auctionState.currentParticipantId = null;
                    }
                    nspace.emit("server:participantBiddingCanceled", { participant: participant });
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log("error in cancelParticipantBidding", error);
                        nspace.emit("server:error", { error: error.message });
                    }
                    else {
                        console.log("error in cancelParticipantBidding", error);
                        nspace.emit("server:error", { error: "An unknown error occurred" });
                    }
                }
            });
            // Handle disconnection
            socket.on("disconnect", () => {
                console.log("User disconnected from auction:", socket.id);
            });
        });
    }
    // Send current auction state to a specific socket
    sendCurrentAuctionState(socket, namespaceName) {
        const auctionSlug = this.getAuctionSlugFromNamespace(namespaceName);
        const auctionState = this.auctionStates.get(auctionSlug);
        console.log("Sending current auction state for:", auctionSlug);
        console.log("Auction state:", auctionState);
        if (!auctionState) {
            console.log("No auction state found for:", auctionSlug);
            return;
        }
        const currentParticipant = auctionState.currentParticipantId ?
            this.participantManager.getParticipant(auctionState.currentParticipantId) : null;
        console.log("Current participant:", currentParticipant);
        const currentState = {
            isActive: auctionState.isActive,
            currentParticipant: currentParticipant,
            auctionStartTime: auctionState.auctionStartTime,
            soldParticipants: auctionState.soldParticipants,
            allParticipants: this.participantManager.getAllParticipants(),
            // Include bidding logs for the current participant if active
            currentBiddingLogs: currentParticipant ? currentParticipant.biddingLogs : [],
            currentHighestBid: currentParticipant ? currentParticipant.currentBid : null
        };
        console.log("Sending current state to socket:", currentState);
        socket.emit("server:currentAuctionState", currentState);
    }
    // Extract auction slug from namespace name
    getAuctionSlugFromNamespace(namespaceName) {
        return namespaceName.replace('/auction-', '');
    }
    // Get current auction state (public method for external access)
    getAuctionState(auctionSlug) {
        return this.auctionStates.get(auctionSlug);
    }
    // Get currently active participant
    getCurrentActiveParticipant(auctionSlug) {
        const auctionState = this.auctionStates.get(auctionSlug);
        if (auctionState?.currentParticipantId) {
            return this.participantManager.getParticipant(auctionState.currentParticipantId) || null;
        }
        return null;
    }
    // Check if auction namespace exists
    doesAuctionExist(auctionSlug) {
        return this.activeAuctions.has(auctionSlug);
    }
    // Get all active auctions
    getAllActiveAuctions() {
        const activeAuctions = [];
        for (const [auctionSlug, state] of this.auctionStates.entries()) {
            activeAuctions.push({
                auctionSlug,
                state
            });
        }
        return activeAuctions;
    }
    // Delete auction (for cleanup purposes)
    deleteAuction(auctionSlug) {
        const nspace = this.activeAuctions.get(auctionSlug);
        if (nspace) {
            nspace.removeAllListeners();
            this.activeAuctions.delete(auctionSlug);
            this.auctionStates.delete(auctionSlug);
            return true;
        }
        return false;
    }
}
class ParticipantManager {
    participants = new Map();
    constructor() {
    }
    addParticipant(auctionSlug, participantId, basePrice, increment, name, image = "", description = "", kd = 0, gamesPlayed = 0) {
        const participant = { auctionSlug, participantId, basePrice, increment, name, image, description, currentBid: null, isSold: false, sellingBid: null, kd, gamesPlayed, biddingLogs: [] };
        this.participants.set(participantId, participant);
    }
    getParticipant(participantId) {
        return this.participants.get(participantId);
    }
    getAllParticipants() {
        return Array.from(this.participants.values());
    }
    getSoldParticipants() {
        return this.getAllParticipants().filter(p => p.isSold);
    }
    getUnsoldParticipants() {
        return this.getAllParticipants().filter(p => !p.isSold);
    }
    addBid(participantId, bid) {
        const participant = this.getParticipant(participantId);
        if (!participant || participant.isSold) {
            throw new Error("participant not found");
        }
        // Check if this is the same team trying to outbid themselves
        const isSameTeam = participant.currentBid && participant.currentBid.teamId === bid.teamId;
        if (bid.amount < participant.basePrice) {
            throw new Error("bid amount is less than the base price");
        }
        // If it's the same team, they can only increase their bid
        if (isSameTeam) {
            if (bid.amount <= participant.currentBid.amount) {
                throw new Error("new bid must be higher than your current bid");
            }
        }
        else {
            // If it's a different team, they must meet the minimum increment
            if (participant.currentBid && bid.amount < participant.currentBid.amount + participant.increment) {
                throw new Error("bid amount must be at least the current bid plus the increment");
            }
        }
        participant.currentBid = bid;
        participant.biddingLogs.push(bid);
    }
    // Get participant with highest bid
    getParticipantWithHighestBid(participantId) {
        const participant = this.getParticipant(participantId);
        return participant?.currentBid || null;
    }
    // Get bidding history for a participant
    getBiddingHistory(participantId) {
        const participant = this.getParticipant(participantId);
        return participant?.biddingLogs || [];
    }
    // Reset participant bidding information
    resetParticipant(participantId) {
        const participant = this.getParticipant(participantId);
        if (participant) {
            participant.currentBid = null;
            participant.biddingLogs = [];
            participant.isSold = false;
            participant.sellingBid = null;
        }
    }
}
//# sourceMappingURL=auction.js.map