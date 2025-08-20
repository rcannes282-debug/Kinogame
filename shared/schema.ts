import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  coins: integer("coins").default(0),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game modes enum
export const gameModeEnum = pgEnum('game_mode', [
  'timed',
  'top250',
  'infinite',
  'multiplayer'
]);

// Question categories enum
export const categoryEnum = pgEnum('category', [
  'by_year',
  'by_genre',
  'by_actor',
  'by_festival',
  'top_250',
  'general'
]);

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(), // A, B, C, or D
  category: categoryEnum("category").notNull(),
  difficulty: integer("difficulty").default(1), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

// Game sessions
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  gameMode: gameModeEnum("game_mode").notNull(),
  category: categoryEnum("category"),
  score: integer("score").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  livesRemaining: integer("lives_remaining").default(5),
  isCompleted: boolean("is_completed").default(false),
  timeSpent: integer("time_spent").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Multiplayer rooms
export const multiplayerRooms = pgTable("multiplayer_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hostId: varchar("host_id").references(() => users.id).notNull(),
  maxPlayers: integer("max_players").default(8),
  currentPlayers: integer("current_players").default(1),
  gameMode: gameModeEnum("game_mode").default('multiplayer'),
  category: categoryEnum("category"),
  timePerQuestion: integer("time_per_question").default(30), // in seconds
  isPrivate: boolean("is_private").default(false),
  password: varchar("password"),
  isActive: boolean("is_active").default(true),
  isStarted: boolean("is_started").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room participants
export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => multiplayerRooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: integer("score").default(0),
  isReady: boolean("is_ready").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// User inventory (for purchased items)
export const userInventory = pgTable("user_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  itemType: varchar("item_type").notNull(), // 'extra_life', '50_50', 'extra_time'
  quantity: integer("quantity").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
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
