import { db } from "./db";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from 'better-sqlite3';

// Создаем схему базы данных
async function createTables() {
  console.log("🗄️  Создаем таблицы базы данных...");
  
  const sqlite = new Database('./database.sqlite');
  
  // Создаем таблицы вручную для SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      coins INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id),
      game_mode TEXT NOT NULL,
      category TEXT,
      score INTEGER DEFAULT 0,
      questions_answered INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      lives_remaining INTEGER DEFAULT 5,
      is_completed INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      completed_at INTEGER
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS multiplayer_rooms (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      host_id TEXT NOT NULL REFERENCES users(id),
      max_players INTEGER DEFAULT 8,
      current_players INTEGER DEFAULT 1,
      game_mode TEXT DEFAULT 'multiplayer',
      category TEXT,
      time_per_question INTEGER DEFAULT 30,
      is_private INTEGER DEFAULT 0,
      password TEXT,
      is_active INTEGER DEFAULT 1,
      is_started INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS room_participants (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      score INTEGER DEFAULT 0,
      is_ready INTEGER DEFAULT 0,
      joined_at INTEGER DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES users(id),
      item_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (unixepoch())
    );
  `);

  sqlite.close();
  console.log("✅ Таблицы успешно созданы!");
}

// Запускаем миграцию если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().then(() => {
    console.log("🎉 Миграция завершена!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Ошибка миграции:", error);
    process.exit(1);
  });
}

export { createTables };