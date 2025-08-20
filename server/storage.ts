import {
  users,
  questions,
  gameSessions,
  multiplayerRooms,
  roomParticipants,
  userInventory,
  type User,
  type UpsertUser,
  type Question,
  type GameSession,
  type MultiplayerRoom,
  type RoomParticipant,
  type UserInventory,
  type InsertQuestion,
  type InsertGameSession,
  type InsertMultiplayerRoom,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<void>;
  updateUserStats(userId: string, score: number): Promise<void>;
  updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | undefined>;
  
  // Question operations
  getQuestionsByCategory(category: string, limit?: number): Promise<Question[]>;
  getRandomQuestions(limit: number, category?: string): Promise<Question[]>;
  getQuestionsForGame(limit: number, category?: string): Promise<Omit<Question, 'correctAnswer'>[]>;
  checkAnswer(questionId: string, answer: string): Promise<boolean>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  getUserGameSessions(userId: string): Promise<GameSession[]>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<Array<User & { rank: number }>>;
  
  // Multiplayer operations
  createRoom(room: InsertMultiplayerRoom): Promise<MultiplayerRoom>;
  getRooms(includePrivate?: boolean): Promise<MultiplayerRoom[]>;
  getRoom(id: string): Promise<MultiplayerRoom | undefined>;
  joinRoom(roomId: string, userId: string): Promise<RoomParticipant>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  getRoomParticipants(roomId: string): Promise<RoomParticipant[]>;
  updateRoomPlayerCount(roomId: string): Promise<void>;
  findAvailableRoom(gameMode?: string, category?: string): Promise<MultiplayerRoom | undefined>;
  
  // Inventory operations
  getUserInventory(userId: string): Promise<UserInventory[]>;
  addToInventory(userId: string, itemType: string, quantity: number): Promise<void>;
  useInventoryItem(userId: string, itemType: string, quantity: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    await db
      .update(users)
      .set({ coins, updatedAt: sql`(unixepoch())` })
      .where(eq(users.id, userId));
  }

  async updateUserStats(userId: string, score: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalScore: sql`${users.totalScore} + ${score}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...profileData, updatedAt: sql`NOW()` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Question operations
  async getQuestionsByCategory(category: string, limit: number = 10): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.category, category))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getRandomQuestions(limit: number, category?: string): Promise<Question[]> {
    if (category) {
      return await db
        .select()
        .from(questions)
        .where(eq(questions.category, category))
        .orderBy(sql`RANDOM()`)
        .limit(limit);
    }
    
    return await db
      .select()
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getQuestionsForGame(limit: number, category?: string): Promise<Omit<Question, 'correctAnswer'>[]> {
    let query = db
      .select({
        id: questions.id,
        question: questions.question,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        category: questions.category,
        difficulty: questions.difficulty,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    if (category) {
      query = query.where(eq(questions.category, category)) as any;
    }
    
    return await query;
  }

  async checkAnswer(questionId: string, answer: string): Promise<boolean> {
    const [question] = await db
      .select({ correctAnswer: questions.correctAnswer })
      .from(questions)
      .where(eq(questions.id, questionId));
    
    return question?.correctAnswer === answer;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  // Game session operations
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const [newSession] = await db
      .insert(gameSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const [updated] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return updated;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, id));
    return session;
  }

  async getUserGameSessions(userId: string): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, userId))
      .orderBy(desc(gameSessions.createdAt));
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 50): Promise<Array<User & { rank: number }>> {
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        coins: users.coins,
        totalScore: users.totalScore,
        gamesPlayed: users.gamesPlayed,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${users.totalScore} DESC)`.as('rank'),
      })
      .from(users)
      .where(sql`${users.totalScore} > 0`)
      .orderBy(desc(users.totalScore))
      .limit(limit);

    return results;
  }

  // Multiplayer operations
  async createRoom(room: InsertMultiplayerRoom): Promise<MultiplayerRoom> {
    const [newRoom] = await db
      .insert(multiplayerRooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async getRooms(includePrivate: boolean = false): Promise<MultiplayerRoom[]> {
    if (includePrivate) {
      return await db
        .select()
        .from(multiplayerRooms)
        .where(and(
          eq(multiplayerRooms.isActive, true),
          eq(multiplayerRooms.isStarted, false)
        ))
        .orderBy(desc(multiplayerRooms.createdAt));
    } else {
      return await db
        .select()
        .from(multiplayerRooms)
        .where(and(
          eq(multiplayerRooms.isActive, true),
          eq(multiplayerRooms.isStarted, false),
          eq(multiplayerRooms.isPrivate, false)
        ))
        .orderBy(desc(multiplayerRooms.createdAt));
    }
  }

  async getRoom(id: string): Promise<MultiplayerRoom | undefined> {
    const [room] = await db
      .select()
      .from(multiplayerRooms)
      .where(eq(multiplayerRooms.id, id));
    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomParticipant> {
    const [participant] = await db
      .insert(roomParticipants)
      .values({ roomId, userId })
      .returning();

    // Update room participant count
    await db
      .update(multiplayerRooms)
      .set({ currentPlayers: sql`${multiplayerRooms.currentPlayers} + 1` })
      .where(eq(multiplayerRooms.id, roomId));

    return participant;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await db
      .delete(roomParticipants)
      .where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ));

    // Update room participant count
    await db
      .update(multiplayerRooms)
      .set({ currentPlayers: sql`${multiplayerRooms.currentPlayers} - 1` })
      .where(eq(multiplayerRooms.id, roomId));
  }

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    return await db
      .select()
      .from(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId))
      .orderBy(asc(roomParticipants.joinedAt));
  }

  async updateRoomPlayerCount(roomId: string): Promise<void> {
    const participants = await this.getRoomParticipants(roomId);
    await db
      .update(multiplayerRooms)
      .set({ currentPlayers: participants.length })
      .where(eq(multiplayerRooms.id, roomId));
  }

  async findAvailableRoom(gameMode?: string, category?: string): Promise<MultiplayerRoom | undefined> {
    let query = db
      .select()
      .from(multiplayerRooms)
      .where(and(
        eq(multiplayerRooms.isActive, true),
        eq(multiplayerRooms.isStarted, false),
        eq(multiplayerRooms.isPrivate, false),
        sql`${multiplayerRooms.currentPlayers} < ${multiplayerRooms.maxPlayers}`
      ))
      .orderBy(desc(multiplayerRooms.createdAt))
      .limit(1);

    if (gameMode) {
      const baseQuery = db
        .select()
        .from(multiplayerRooms)
        .where(and(
          eq(multiplayerRooms.isActive, true),
          eq(multiplayerRooms.isStarted, false),
          eq(multiplayerRooms.isPrivate, false),
          sql`${multiplayerRooms.currentPlayers} < ${multiplayerRooms.maxPlayers}`,
          eq(multiplayerRooms.gameMode, gameMode),
          category ? eq(multiplayerRooms.category, category) : sql`1=1`
        ))
        .orderBy(desc(multiplayerRooms.createdAt))
        .limit(1);
      
      const [room] = await baseQuery;
      return room;
    }

    const [room] = await query;
    return room;
  }

  // Inventory operations
  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId));
  }

  async addToInventory(userId: string, itemType: string, quantity: number): Promise<void> {
    const existing = await db
      .select()
      .from(userInventory)
      .where(and(
        eq(userInventory.userId, userId),
        eq(userInventory.itemType, itemType)
      ));

    if (existing.length > 0) {
      await db
        .update(userInventory)
        .set({
          quantity: sql`${userInventory.quantity} + ${quantity}`,
          updatedAt: sql`(unixepoch())`,
        })
        .where(and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemType, itemType)
        ));
    } else {
      await db
        .insert(userInventory)
        .values({ userId, itemType, quantity });
    }
  }

  async useInventoryItem(userId: string, itemType: string, quantity: number = 1): Promise<boolean> {
    const [item] = await db
      .select()
      .from(userInventory)
      .where(and(
        eq(userInventory.userId, userId),
        eq(userInventory.itemType, itemType)
      ));

    if (!item || (item.quantity || 0) < quantity) {
      return false;
    }

    await db
      .update(userInventory)
      .set({
        quantity: sql`${userInventory.quantity} - ${quantity}`,
        updatedAt: sql`(unixepoch())`,
      })
      .where(and(
        eq(userInventory.userId, userId),
        eq(userInventory.itemType, itemType)
      ));

    return true;
  }
}

export const storage = new DatabaseStorage();
