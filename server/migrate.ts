import { db } from "./db";
import * as schema from "@shared/schema";

// Создаем схему базы данных для PostgreSQL
async function createTables() {
  console.log("🗄️  Создаем таблицы базы данных...");
  
  try {
    // Используем Drizzle для создания таблиц
    await db.execute(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    
    console.log("✅ Расширение uuid-ossp включено!");
    
    // Создаем таблицы
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        coins INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id),
        game_mode TEXT NOT NULL,
        category TEXT,
        score INTEGER DEFAULT 0,
        questions_answered INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        lives_remaining INTEGER DEFAULT 5,
        is_completed BOOLEAN DEFAULT false,
        time_spent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS multiplayer_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        host_id TEXT NOT NULL REFERENCES users(id),
        max_players INTEGER DEFAULT 8,
        current_players INTEGER DEFAULT 1,
        game_mode TEXT DEFAULT 'multiplayer',
        category TEXT,
        time_per_question INTEGER DEFAULT 30,
        is_private BOOLEAN DEFAULT false,
        password TEXT,
        is_active BOOLEAN DEFAULT true,
        is_started BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS room_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES multiplayer_rooms(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        score INTEGER DEFAULT 0,
        is_ready BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id),
        item_type TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Таблицы успешно созданы!");
  } catch (error) {
    console.error("💥 Ошибка создания таблиц:", error);
    throw error;
  }
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