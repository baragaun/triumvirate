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
        create database if not exists triumvirate;
      `);

      await db.execute(sql`
        drop table if exists chat_messages;
        drop table if exists chats;
        drop table if exists chat_configs;
        drop table if exists llms;
        drop table if exists sessions;
        drop table if exists users;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id varchar(255) PRIMARY KEY NOT NULL,
          username varchar(255) NOT NULL UNIQUE,
          password_hash varchar(255),
          is_admin BOOLEAN NOT NULL DEFAULT FALSE,
          is_staff BOOLEAN NOT NULL DEFAULT FALSE,
          metadata JSONB,
          track_id varchar(255),
          client_info JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        create index if not exists users_username_index on users (username);
        create index if not exists users_is_admin_index on users (is_admin);
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS llms (
          id varchar(255) PRIMARY KEY NOT NULL,
          name varchar(255) NOT NULL,
          provider varchar(255) NOT NULL,
          description text,
          token_cost real NOT NULL DEFAULT 0,
          input_token_cost real NOT NULL DEFAULT 0,
          output_token_cost real NOT NULL DEFAULT 0,
          is_on_demand BOOLEAN NOT NULL DEFAULT FALSE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_available BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        create index if not exists llms_name_index on llms (name);
        create index if not exists llms_provider_index on llms (provider);
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_configs (
          id varchar(255) PRIMARY KEY NOT NULL,
          description TEXT,
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          caption varchar(255),
          introduction TEXT,
          feedback_button_value_0 VARCHAR(20),
          feedback_button_value_1 VARCHAR(20),
          feedback_button_value_2 VARCHAR(20),
          feedback_button_value_3 VARCHAR(20),
          feedback_button_value_4 VARCHAR(20),
          feedback_button_label_0 VARCHAR(20),
          feedback_button_label_1 VARCHAR(20),
          feedback_button_label_2 VARCHAR(20),
          feedback_button_label_3 VARCHAR(20),
          feedback_button_label_4 VARCHAR(20),
          feedback_button_title_0 VARCHAR(255),
          feedback_button_title_1 VARCHAR(255),
          feedback_button_title_2 VARCHAR(255),
          feedback_button_title_3 VARCHAR(255),
          feedback_button_title_4 VARCHAR(255),
          feedback_button_icon_0 VARCHAR(255),
          feedback_button_icon_1 VARCHAR(255),
          feedback_button_icon_2 VARCHAR(255),
          feedback_button_icon_3 VARCHAR(255),
          feedback_button_icon_4 VARCHAR(20),
          feedback_button_llm_text_0 VARCHAR(255),
          feedback_button_llm_text_1 VARCHAR(255),
          feedback_button_llm_text_2 VARCHAR(255),
          feedback_button_llm_text_3 VARCHAR(255),
          feedback_button_llm_text_4 VARCHAR(255),
          feedback_question_0 TEXT,
          feedback_question_1 TEXT,
          feedback_question_2 TEXT,
          feedback_question_3 TEXT,
          feedback_question_4 TEXT,
          feedback_question_5 TEXT,
          feedback_question_6 TEXT,
          feedback_question_7 TEXT,
          feedback_question_8 TEXT,
          feedback_question_9 TEXT,
          welcome_message TEXT,
          llm_id varchar(255) NOT NULL,
          llm_instructions TEXT,
          llm_temperature REAL,
          llm_max_tokens INTEGER,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (llm_id) REFERENCES llms(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        );
        create index if not exists chat_configs_is_default_index on chat_configs (is_default);
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chats (
          id varchar(255) PRIMARY KEY NOT NULL,
          config_id varchar(255),
          caption varchar(255),
          title varchar(255),
          mode varchar(20),
          user_id varchar(255),
          user_name varchar(255),
          welcome_message TEXT,
          llm_id varchar(255) NOT NULL,
          llm_instructions TEXT,
          llm_temperature REAL,
          llm_max_tokens INTEGER,
          input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0,
          cost REAL NOT NULL DEFAULT 0,
          metadata JSONB,
          feedback TEXT,
          rating INTEGER,
          feedback_button_value_0 VARCHAR(20),
          feedback_button_value_1 VARCHAR(20),
          feedback_button_value_2 VARCHAR(20),
          feedback_button_value_3 VARCHAR(20),
          feedback_button_value_4 VARCHAR(20),
          feedback_button_label_0 VARCHAR(20),
          feedback_button_label_1 VARCHAR(20),
          feedback_button_label_2 VARCHAR(20),
          feedback_button_label_3 VARCHAR(20),
          feedback_button_label_4 VARCHAR(20),
          feedback_button_title_0 VARCHAR(255),
          feedback_button_title_1 VARCHAR(255),
          feedback_button_title_2 VARCHAR(255),
          feedback_button_title_3 VARCHAR(255),
          feedback_button_title_4 VARCHAR(255),
          feedback_button_icon_0 VARCHAR(255),
          feedback_button_icon_1 VARCHAR(255),
          feedback_button_icon_2 VARCHAR(255),
          feedback_button_icon_3 VARCHAR(255),
          feedback_button_icon_4 VARCHAR(255),
          feedback_button_llm_text_0 VARCHAR(255),
          feedback_button_llm_text_1 VARCHAR(255),
          feedback_button_llm_text_2 VARCHAR(255),
          feedback_button_llm_text_3 VARCHAR(255),
          feedback_button_llm_text_4 VARCHAR(255),
          feedback_question_0 TEXT,
          feedback_question_1 TEXT,
          feedback_question_2 TEXT,
          feedback_question_3 TEXT,
          feedback_question_4 TEXT,
          feedback_question_5 TEXT,
          feedback_question_6 TEXT,
          feedback_question_7 TEXT,
          feedback_question_8 TEXT,
          feedback_question_9 TEXT,
          feedback_answer_0 TEXT,
          feedback_answer_1 TEXT,
          feedback_answer_2 TEXT,
          feedback_answer_3 TEXT,
          feedback_answer_4 TEXT,
          feedback_answer_5 TEXT,
          feedback_answer_6 TEXT,
          feedback_answer_7 TEXT,
          feedback_answer_8 TEXT,
          feedback_answer_9 TEXT,
          ended_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
          FOREIGN KEY (config_id) REFERENCES chat_configs(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
          FOREIGN KEY (llm_id) REFERENCES llms(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        );
        create index if not exists chats_config_id_index on chats (config_id);
        create index if not exists chats_user_id_index on chats (user_id);
        create index if not exists chats_user_name_index on chats (user_name);
        create index if not exists chats_llm_id_index on chats (llm_id);
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id varchar(255) PRIMARY KEY NOT NULL,
          chat_id varchar(255) NOT NULL,
          role varchar(10) NOT NULL,
          send_to_llm BOOLEAN NOT NULL DEFAULT TRUE,
          send_to_user BOOLEAN NOT NULL DEFAULT TRUE,
          replaced BOOLEAN NOT NULL DEFAULT FALSE,
          content TEXT NOT NULL,
          send_status varchar(255),
          iteration INTEGER,
          error varchar(255),
          llm_id varchar(255),
          llm_instructions TEXT,
          llm_temperature REAL,
          input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0,
          cost REAL NOT NULL DEFAULT 0,
          metadata JSONB,
          feedback TEXT,
          rating INTEGER,
          response_time INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        );
        create index if not exists chat_messages_chat_id_index on chat_messages (chat_id);
        create index if not exists chat_messages_role_index on chat_messages (role);
        create index if not exists chat_messages_iteration_index on chat_messages (iteration);
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id varchar(255) PRIMARY KEY NOT NULL,
          user_id varchar(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        );
        create index if not exists sessions_user_id_index on sessions (user_id);
      `);
    }

    // console.log('Database initialized successfully');

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
