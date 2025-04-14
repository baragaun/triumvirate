import { sql } from 'drizzle-orm';
import dataStore from '$lib/server/dataStore';

let initialized = false;

export const initDb = async (recreate = false) => {
  if (initialized) {
    console.log('Database already initialized');
    return true;
  }
  initialized = true;

  try {
    if (recreate) {
      const db = dataStore.db.get();

      console.log('Initializing database...');

      await db.execute(sql`
        drop table chat_messages;
        drop table chats;
        drop table chat_configs;
        drop table llms;
        drop table users;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id varchar(255) PRIMARY KEY NOT NULL,
          name varchar(255) NOT NULL UNIQUE,
          password_hash varchar(255) NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS llms (
          id varchar(255) PRIMARY KEY NOT NULL,
          name varchar(255) NOT NULL,
          provider varchar(255) NOT NULL,
          description text,
          is_on_demand BOOLEAN NOT NULL DEFAULT FALSE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_configs (
          id varchar(255) PRIMARY KEY NOT NULL,
          caption varchar(255),
          description TEXT,
          welcome_message TEXT,
          llm_id varchar(255) NOT NULL,
          llm_instructions TEXT,
          llm_temperature REAL,
          llm_max_tokens INTEGER,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (llm_id) REFERENCES llms(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chats (
          id varchar(255) PRIMARY KEY NOT NULL,
          caption varchar(255),
          title varchar(255),
          mode varchar(20),
          user_id varchar(255),
          user_name varchar(255),
          llm_id varchar(255) NOT NULL,
          llm_instructions TEXT,
          config_id varchar(255),
          llm_temperature REAL,
          llm_max_tokens INTEGER,
          feedback TEXT,
          rating INTEGER,
          ended_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
          FOREIGN KEY (config_id) REFERENCES chat_configs(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
          FOREIGN KEY (llm_id) REFERENCES llms(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id varchar(255) PRIMARY KEY NOT NULL,
          chat_id varchar(255) NOT NULL,
          role varchar(10) NOT NULL,
          send_to_llm BOOLEAN NOT NULL DEFAULT TRUE,
          send_to_user BOOLEAN NOT NULL DEFAULT TRUE,
          content TEXT NOT NULL,
          send_status varchar(255),
          iteration INTEGER,
          error varchar(255),
          feedback TEXT,
          llm_id varchar(255),
          llm_instructions TEXT,
          llm_temperature REAL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        )
      `);
    }

    // console.log('Database initialized successfully');

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
