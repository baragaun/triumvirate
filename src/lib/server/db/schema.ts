import { pgTable, text, timestamp, boolean, real, integer, json } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash'),
	isAdmin: boolean('is_admin').notNull().default(false),
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
	caption: text('caption'),
	title: text('title'),
	mode: text('mode'),
	userId: text('user_id').references(() => user.id),
	username: text('user_name'), // Name of the test user
	llmId: text('llm_id').notNull(), // The model used (e.g., amazon.nova-lite-v1:0)
	configId: text('config_id'), // Reference to the CHAT config used
	welcomeMessage: text('welcome_message'), // The first message to send to the user
	llmInstructions: text('llm_instructions'), // The instructions used at the start of the chat
	llmTemperature: real('llm_temperature'), // The model temperature used
	llmMaxTokens: integer('llm_max_tokens'), // The maximum number of tokens used
	inputTokens: integer('input_tokens').notNull().default(0),
	outputTokens: integer('output_tokens').notNull().default(0),
	cost: real('cost').notNull().default(0),
	metadata: json('metadata'),
	feedback: text('feedback'), // User feedback on the chat
	rating: integer('rating'), // Numerical rating of the chat
	endedAt: timestamp('ended_at'), // When the chat ended
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatMessage = pgTable('chat_messages', {
	id: text('id').primaryKey(),
	chatId: text('chat_id').notNull().references(() => chat.id),
	role: text('role').notNull(), // 'user', 'assistant', or 'platform'
	content: text('content').notNull(),
	iteration: integer('iteration'),
	feedback: text('feedback'), // feedback that the user provided for a message from the assistant
	sendToLlm: boolean('send_to_llm').notNull().default(true),
	sendToUser: boolean('send_to_user').notNull().default(true),
	replaced: boolean('replaced').notNull().default(false),
	sendStatus: text('send_status'), // status of sending/receiving
	error: text('error'), // any error message
	metadata: json('metadata'),
	llmId: text('llm_id'), // The model used (e.g., amazon.nova-lite-v1:0)
	llmInstructions: text('llm_instructions'), // The instructions used at the start of the chat
	llmTemperature: real('llm_temperature'), // The model temperature used
	inputTokens: integer('input_tokens').notNull().default(0),
	outputTokens: integer('output_tokens').notNull().default(0),
	cost: real('cost').notNull().default(0),
	responseTime: real('response_time').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatConfig = pgTable('chat_configs', {
	id: text('id').primaryKey(),
	description: text('description'), // Description of the CHAT config
	caption: text('caption'),
	isDefault: boolean('is_default').notNull().default(false),
	welcomeMessage: text('welcome_message'), // The first message to send to the user
	llmId: text('llm_id').notNull(), // The model used (e.g., amazon.nova-lite-v1:0)
	llmInstructions: text('llm_instructions').notNull(), // The instructions used at the start of the chat
	llmTemperature: real('llm_temperature'), // The model temperature used
	llmMaxTokens: integer('llm_max_tokens'), // The maximum number of tokens used
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const llm = pgTable('llms', {
	id: text('id').primaryKey(), // The model ID (e.g., amazon.nova-lite-v1:0)
	name: text('name').notNull(), // The model name
	provider: text('provider').notNull(), // The provider (e.g., Amazon, Anthropic)
	description: text('description'), // Description of the model
	tokenCost: real('token_cost').notNull().default(0),
	isOnDemand: boolean('is_on_demand').notNull().default(false),
	isActive: boolean('is_active').notNull().default(false),
	isAvailable: boolean('is_available').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Chat = typeof chat.$inferSelect;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type ChatConfig = typeof chatConfig.$inferSelect;
export type Llm = typeof llm.$inferSelect;
export type Session = typeof session.$inferSelect;
