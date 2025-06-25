import { pgTable, text, timestamp, boolean, real, integer, json } from 'drizzle-orm/pg-core';
export const user = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	email: text('email').unique(),
	passwordHash: text('password_hash'),
	isAdmin: boolean('is_admin').notNull().default(false),
	isStaff: boolean('is_staff').notNull().default(false),
	metadata: json('metadata'),
	trackId: text('track_id'),
	clientInfo: json('client_info'),
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
	userName: text('user_name'), // Name of the test user
	llmId: text('llm_id').notNull(), // The model used (e.g., amazon.nova-lite-v1:0)
	configId: text('config_id'), // Reference to the chat config used
	welcomeMessage: text('welcome_message'), // The first message to send to the user
	llmInstructions: text('llm_instructions'), // The instructions used at the start of the chat
	llmTemperature: real('llm_temperature'), // The model temperature used
	llmMaxTokens: integer('llm_max_tokens'), // The maximum number of tokens used
	inputTokens: integer('input_tokens').notNull().default(0),
	outputTokens: integer('output_tokens').notNull().default(0),
	cost: real('cost').notNull().default(0),
	metadata: json('metadata'),
	stage: text('stage'),
	feedbackButtonValue0: text('feedback_button_value_0'),
	feedbackButtonValue1: text('feedback_button_value_1'),
	feedbackButtonValue2: text('feedback_button_value_2'),
	feedbackButtonValue3: text('feedback_button_value_3'),
	feedbackButtonValue4: text('feedback_button_value_4'),
	feedbackButtonLabel0: text('feedback_button_label_0'),
	feedbackButtonLabel1: text('feedback_button_label_1'),
	feedbackButtonLabel2: text('feedback_button_label_2'),
	feedbackButtonLabel3: text('feedback_button_label_3'),
	feedbackButtonLabel4: text('feedback_button_label_4'),
	feedbackButtonTitle0: text('feedback_button_title_0'),
	feedbackButtonTitle1: text('feedback_button_title_1'),
	feedbackButtonTitle2: text('feedback_button_title_2'),
	feedbackButtonTitle3: text('feedback_button_title_3'),
	feedbackButtonTitle4: text('feedback_button_title_4'),
	feedbackButtonIcon0: text('feedback_button_icon_0'),
	feedbackButtonIcon1: text('feedback_button_icon_1'),
	feedbackButtonIcon2: text('feedback_button_icon_2'),
	feedbackButtonIcon3: text('feedback_button_icon_3'),
	feedbackButtonIcon4: text('feedback_button_icon_4'),
	feedbackButtonLlmText0: text('feedback_button_llm_text_0'),
	feedbackButtonLlmText1: text('feedback_button_llm_text_1'),
	feedbackButtonLlmText2: text('feedback_button_llm_text_2'),
	feedbackButtonLlmText3: text('feedback_button_llm_text_3'),
	feedbackButtonLlmText4: text('feedback_button_llm_text_4'),
	ratingQuestion: text('rating_question'),
	rating: integer('rating'), // Numerical rating of the chat
	feedback: text('feedback'), // User feedback on the chat
	feedbackQuestion0: text('feedback_question_0'),
	feedbackQuestion1: text('feedback_question_1'),
	feedbackQuestion2: text('feedback_question_2'),
	feedbackQuestion3: text('feedback_question_3'),
	feedbackQuestion4: text('feedback_question_4'),
	feedbackQuestion5: text('feedback_question_5'),
	feedbackQuestion6: text('feedback_question_6'),
	feedbackQuestion7: text('feedback_question_7'),
	feedbackQuestion8: text('feedback_question_8'),
	feedbackQuestion9: text('feedback_question_9'),
	feedbackAnswer0: text('feedback_answer_0'),
	feedbackAnswer1: text('feedback_answer_1'),
	feedbackAnswer2: text('feedback_answer_2'),
	feedbackAnswer3: text('feedback_answer_3'),
	feedbackAnswer4: text('feedback_answer_4'),
	feedbackAnswer5: text('feedback_answer_5'),
	feedbackAnswer6: text('feedback_answer_6'),
	feedbackAnswer7: text('feedback_answer_7'),
	feedbackAnswer8: text('feedback_answer_8'),
	feedbackAnswer9: text('feedback_answer_9'),
	endedAt: timestamp('ended_at'), // When the chat ended
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatMessage = pgTable('chat_messages', {
	id: text('id').primaryKey(),
	chatId: text('chat_id').notNull().references(() => chat.id),
	role: text('role').notNull(), // 'user', 'assistant', or 'platform'
	stage: text('stage'),
	content: text('content').notNull(),
	iteration: integer('iteration'),
	sendToLlm: boolean('send_to_llm').notNull().default(true),
	sendToUser: boolean('send_to_user').notNull().default(true),
	replaced: boolean('replaced').notNull().default(false),
	sendStatus: text('send_status'), // status of sending/receiving
	error: text('error'), // any error message
	llmId: text('llm_id'), // The model used (e.g., amazon.nova-lite-v1:0)
	llmInstructions: text('llm_instructions'), // The instructions used at the start of the chat
	llmTemperature: real('llm_temperature'), // The model temperature used
	inputTokens: integer('input_tokens').notNull().default(0),
	outputTokens: integer('output_tokens').notNull().default(0),
	cost: real('cost').notNull().default(0),
	metadata: json('metadata'),
	feedback: text('feedback'), // feedback that the user provided for a message from the assistant
	rating: integer('rating'), // Numerical rating of the chat
	responseTime: real('response_time').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatConfig = pgTable('chat_configs', {
	id: text('id').primaryKey(),
	name: text('name'),
	isDefault: boolean('is_default').notNull().default(false),
	description: text('description'),
	caption: text('caption'),
	introduction: text('introduction'),
	feedbackButtonValue0: text('feedback_button_value_0'),
	feedbackButtonValue1: text('feedback_button_value_1'),
	feedbackButtonValue2: text('feedback_button_value_2'),
	feedbackButtonValue3: text('feedback_button_value_3'),
	feedbackButtonValue4: text('feedback_button_value_4'),
	feedbackButtonLabel0: text('feedback_button_label_0'),
	feedbackButtonLabel1: text('feedback_button_label_1'),
	feedbackButtonLabel2: text('feedback_button_label_2'),
	feedbackButtonLabel3: text('feedback_button_label_3'),
	feedbackButtonLabel4: text('feedback_button_label_4'),
	feedbackButtonTitle0: text('feedback_button_title_0'),
	feedbackButtonTitle1: text('feedback_button_title_1'),
	feedbackButtonTitle2: text('feedback_button_title_2'),
	feedbackButtonTitle3: text('feedback_button_title_3'),
	feedbackButtonTitle4: text('feedback_button_title_4'),
	feedbackButtonIcon0: text('feedback_button_icon_0'),
	feedbackButtonIcon1: text('feedback_button_icon_1'),
	feedbackButtonIcon2: text('feedback_button_icon_2'),
	feedbackButtonIcon3: text('feedback_button_icon_3'),
	feedbackButtonIcon4: text('feedback_button_icon_4'),
	feedbackButtonLlmText0: text('feedback_button_llm_text_0'),
	feedbackButtonLlmText1: text('feedback_button_llm_text_1'),
	feedbackButtonLlmText2: text('feedback_button_llm_text_2'),
	feedbackButtonLlmText3: text('feedback_button_llm_text_3'),
	feedbackButtonLlmText4: text('feedback_button_llm_text_4'),
	ratingQuestion: text('rating_question'),
	feedbackQuestion0: text('feedback_question_0'),
	feedbackQuestion1: text('feedback_question_1'),
	feedbackQuestion2: text('feedback_question_2'),
	feedbackQuestion3: text('feedback_question_3'),
	feedbackQuestion4: text('feedback_question_4'),
	feedbackQuestion5: text('feedback_question_5'),
	feedbackQuestion6: text('feedback_question_6'),
	feedbackQuestion7: text('feedback_question_7'),
	feedbackQuestion8: text('feedback_question_8'),
	feedbackQuestion9: text('feedback_question_9'),
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
	arn: text('arn').notNull(), // The AWS ARN
	provider: text('provider').notNull(), // The provider (e.g., Amazon, Anthropic)
	description: text('description'), // Description of the model
	tokenCost: real('token_cost').notNull().default(0),
	inputTokenCost: real('input_token_cost').notNull().default(0),
	outputTokenCost: real('output_token_cost').notNull().default(0),
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
