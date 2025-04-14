import { pgTable, text, timestamp, boolean, real, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chat = pgTable('chats', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id),
	llmId: text('llm_id').notNull(), // The model used (e.g., amazon.nova-lite-v1:0)
	llmContextId: text('llm_context_id'), // Reference to the LLM context used
	llmTemperature: real('llm_temperature'), // The model temperature used
	llmMaxTokens: integer('llm_max_tokens'), // The maximum number of tokens used
	title: text('title'),
	userName: text('user_name'), // Name of the test user
	feedback: text('feedback'), // User feedback on the chat
	rating: integer('rating'), // Numerical rating of the chat
	endedAt: timestamp('ended_at'), // When the chat ended
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatMessage = pgTable('chat_messages', {
	id: text('id').primaryKey(),
	chatId: text('chat_id').notNull().references(() => chat.id),
	role: text('role').notNull(), // 'user', 'assistant', or 'system'
	sendToLlm: boolean('send_to_llm').notNull().default(true),
	sendToUser: boolean('send_to_user').notNull().default(true),
	content: text('content').notNull(),
	status: text('status'), // status of sending/receiving
	error: text('error'), // any error message
	feedback: text('feedback'), // feedback that the user provided for a message from the assistant
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const llm = pgTable('llms', {
	id: text('id').primaryKey(), // The model ID (e.g., amazon.nova-lite-v1:0)
	name: text('name').notNull(), // The model name
	provider: text('provider').notNull(), // The provider (e.g., Amazon, Anthropic)
	description: text('description'), // Description of the model
	isOnDemand: boolean('is_on_demand').notNull().default(false),
	isActive: boolean('is_active').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const llmContext = pgTable('llm_contexts', {
	id: text('id').primaryKey(),
	description: text('description'), // Description of the LLM context
	instructions: text('instructions').notNull(), // The actual instructions
	welcomeMessage: text('welcome_message'), // The first message to send to the user
	llmId: text('llm_id').notNull(), // The model used (e.g., amazon.nova-lite-v1:0)
	llmTemperature: real('llm_temperature'), // The model temperature used
	llmMaxTokens: integer('llm_max_tokens'), // The maximum number of tokens used
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type User = typeof user.$inferSelect;
export type Chat = typeof chat.$inferSelect;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type Llm = typeof llm.$inferSelect;
export type LlmContext = typeof llmContext.$inferSelect;
export type Session = typeof session.$inferSelect;
