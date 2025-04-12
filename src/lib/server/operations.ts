import { createChat } from '$lib/server/chat/createChat'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage'
import { createLlm } from '$lib/server/llm/createLlm'
import { createLlmContext } from '$lib/server/llmContext/createLlmContext'
import { createUser } from '$lib/server/user/createUser'
import { deleteChat } from '$lib/server/chat/deleteChat'
import { deleteChatMessage } from '$lib/server/chatMessage/deleteChatMessage'
import { deleteLlm } from '$lib/server/llm/deleteLlm'
import { deleteLlmContext } from '$lib/server/llmContext/deleteLlmContext'
import { endChat } from '$lib/server/chat/endChat'
import { findChat } from '$lib/server/chat/findChat'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'
import { findChats } from '$lib/server/chat/findChats'
import { findLlm } from '$lib/server/llm/findLlm'
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'
import { findLlmContexts } from '$lib/server/llmContext/findLlmContexts'
import { findLlms } from '$lib/server/llm/findLlms'
import { findOrCreateUser } from '$lib/server/user/findOrCreateUser'
import { findUser } from '$lib/server/user/findUser'
import { findUsers } from '$lib/server/user/findUsers'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'
import { importBedrockModels } from '$lib/server/bedrock/importBedrockModels'
import { importLlmContexts } from '$lib/server/llmContext/importLlmContexts'
import { saveMultipleLlms } from '$lib/server/llm/saveMultipleLlms'
import { startServer } from '$lib/server/startServer'
import { updateChat } from '$lib/server/chat/updateChat'
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage'
import { updateLlm } from '$lib/server/llm/updateLlm'
import { updateLlmContext } from '$lib/server/llmContext/updateLlmContext'
import { updateUser } from '$lib/server/user/updateUser'
import { upsertChat } from '$lib/server/chat/upsertChat'
import { upsertChatMessage } from '$lib/server/chatMessage/upsertChatMessage'
import { upsertLlm } from '$lib/server/llm/upsertLlm'
import { upsertLlmContext } from '$lib/server/llmContext/upsertLlmContext'
import { upsertUser } from '$lib/server/user/upsertUser'
import dataStore from '$lib/server/dataStore';

const operations = {
  startServer,
  isStarted: () => dataStore.isStarted(),

  bedrock: {
    generateResponse: generateBedrockResponse,
    loadModels: importBedrockModels,
  },
  chat: {
    create: createChat,
    delete: deleteChat,
    end: endChat,
    find: findChats,
    findOne: findChat,
    update: updateChat,
    upsert: upsertChat,
  },
  chatMessage: {
    create: createChatMessage,
    delete: deleteChatMessage,
    find: findChatMessages,
    findOne: findChatMessage,
    update: updateChatMessage,
    upsert: upsertChatMessage,
  },
  llm: {
    create: createLlm,
    delete: deleteLlm,
    find: findLlms,
    findOne: findLlm,
    saveMultiple: saveMultipleLlms,
    update: updateLlm,
    upsert: upsertLlm,
  },
  llmContext: {
    create: createLlmContext,
    delete: deleteLlmContext,
    find: findLlmContexts,
    findOne: findLlmContext,
    import: importLlmContexts,
    update: updateLlmContext,
    upsert: upsertLlmContext,
  },
  user: {
    create: createUser,
    find: findUsers,
    findOne: findUser,
    findOrCreate: findOrCreateUser,
    update: updateUser,
    upsert: upsertUser,
  }
};

export default operations;
