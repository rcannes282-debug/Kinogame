import { sql, relations } from 'drizzle-orm';
import {
  index,
  text as sqliteText,
  sqliteTable,
  integer,
  text,
  blob,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table (mandatory for Replit Auth)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  coins: integer("coins").default(0),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // A, B, C, or D
  category: text("category").notNull(),
  difficulty: integer("difficulty").default(1), // 1-5
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Game sessions
export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id),
  gameMode: text("game_mode").notNull(),
  category: text("category"),
  score: integer("score").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  livesRemaining: integer("lives_remaining").default(5),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false),
  timeSpent: integer("time_spent").default(0), // in seconds
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
});

// Multiplayer rooms
export const multiplayerRooms = sqliteTable("multiplayer_rooms", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  hostId: text("host_id").references(() => users.id).notNull(),
  maxPlayers: integer("max_players").default(8),
  currentPlayers: integer("current_players").default(1),
  gameMode: text("game_mode").default('multiplayer'),
  category: text("category"),
  timePerQuestion: integer("time_per_question").default(30), // in seconds
  isPrivate: integer("is_private", { mode: 'boolean' }).default(false),
  password: text("password"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  isStarted: integer("is_started", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Room participants
export const roomParticipants = sqliteTable("room_participants", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  roomId: text("room_id").references(() => multiplayerRooms.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  score: integer("score").default(0),
  isReady: integer("is_ready", { mode: 'boolean' }).default(false),
  joinedAt: integer("joined_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// User inventory (for purchased items)
export const userInventory = sqliteTable("user_inventory", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id).notNull(),
  itemType: text("item_type").notNull(), // 'extra_life', '50_50', 'extra_time'
  quantity: integer("quantity").default(0),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  gameSessions: many(gameSessions),
  hostedRooms: many(multiplayerRooms),
  roomParticipations: many(roomParticipants),
  inventory: many(userInventory),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  user: one(users, {
    fields: [gameSessions.userId],
    references: [users.id],
  }),
}));

export const multiplayerRoomsRelations = relations(multiplayerRooms, ({ one, many }) => ({
  host: one(users, {
    fields: [multiplayerRooms.hostId],
    references: [users.id],
  }),
  participants: many(roomParticipants),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(multiplayerRooms, {
    fields: [roomParticipants.roomId],
    references: [multiplayerRooms.id],
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, {
    fields: [userInventory.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMultiplayerRoomSchema = createInsertSchema(multiplayerRooms).omit({
  id: true,
  currentPlayers: true,
  isActive: true,
  isStarted: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id: string };
export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type MultiplayerRoom = typeof multiplayerRooms.$inferSelect;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type UserInventory = typeof userInventory.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type InsertMultiplayerRoom = z.infer<typeof insertMultiplayerRoomSchema>;
