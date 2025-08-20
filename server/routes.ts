import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertGameSessionSchema, 
  insertMultiplayerRoomSchema,
  insertQuestionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Question routes
  app.get('/api/questions/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await storage.getQuestionsByCategory(category, limit);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const questions = await storage.getRandomQuestions(limit, category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Game session routes
  app.post('/api/game-sessions', async (req, res) => {
    try {
      const sessionData = insertGameSessionSchema.parse(req.body);
      
      // If user is authenticated, use their ID
      if (req.isAuthenticated && req.isAuthenticated()) {
        sessionData.userId = (req.user as any).claims.sub;
      }
      
      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ message: "Failed to create game session" });
    }
  });

  app.put('/api/game-sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // If completing a game and user is authenticated, update their stats
      if (updates.isCompleted && req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        await storage.updateUserStats(userId, updates.score || 0);
      }
      
      const session = await storage.updateGameSession(id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(500).json({ message: "Failed to update game session" });
    }
  });

  app.get('/api/game-sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getGameSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ message: "Failed to fetch game session" });
    }
  });

  app.get('/api/users/:userId/game-sessions', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const sessions = await storage.getUserGameSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching user game sessions:", error);
      res.status(500).json({ message: "Failed to fetch user game sessions" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Multiplayer routes
  app.post('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const roomData = insertMultiplayerRoomSchema.parse(req.body);
      roomData.hostId = (req.user as any).claims.sub;
      
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get('/api/rooms', async (req, res) => {
    try {
      const includePrivate = req.query.includePrivate === 'true';
      const rooms = await storage.getRooms(includePrivate);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoom(id);
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post('/api/rooms/:id/join', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      const participant = await storage.joinRoom(id, userId);
      res.json(participant);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.post('/api/rooms/:id/leave', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      await storage.leaveRoom(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  app.get('/api/rooms/:id/participants', async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getRoomParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching room participants:", error);
      res.status(500).json({ message: "Failed to fetch room participants" });
    }
  });

  // Shop and inventory routes
  app.get('/api/users/:userId/inventory', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching user inventory:", error);
      res.status(500).json({ message: "Failed to fetch user inventory" });
    }
  });

  app.post('/api/users/:userId/buy-coins', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, coins } = req.body;
      
      // TODO: Integrate with payment system (YooKassa)
      // For now, just add coins (this would be done after successful payment)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.updateUserCoins(userId, (user.coins || 0) + coins);
      res.json({ success: true, newBalance: (user.coins || 0) + coins });
    } catch (error) {
      console.error("Error buying coins:", error);
      res.status(500).json({ message: "Failed to buy coins" });
    }
  });

  app.post('/api/users/:userId/buy-item', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { itemType, quantity, cost } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.coins || 0) < cost) {
        return res.status(400).json({ message: "Insufficient coins" });
      }
      
      await storage.updateUserCoins(userId, (user.coins || 0) - cost);
      await storage.addToInventory(userId, itemType, quantity);
      
      res.json({ success: true, newBalance: (user.coins || 0) - cost });
    } catch (error) {
      console.error("Error buying item:", error);
      res.status(500).json({ message: "Failed to buy item" });
    }
  });

  app.post('/api/users/:userId/use-item', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { itemType, quantity } = req.body;
      
      const success = await storage.useInventoryItem(userId, itemType, quantity);
      res.json({ success });
    } catch (error) {
      console.error("Error using item:", error);
      res.status(500).json({ message: "Failed to use item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
