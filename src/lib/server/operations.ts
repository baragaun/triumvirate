import { createChat } from '$lib/server/chat/createChat'
import { createChatConfig } from '$lib/server/chatConfig/createChatConfig'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage'
import { createLlm } from '$lib/server/llm/createLlm'
import { createUser } from '$lib/server/user/createUser'
import { deleteChat } from '$lib/server/chat/deleteChat'
import { deleteChatConfig } from '$lib/server/chatConfig/deleteChatConfig'
import { deleteChatMessage } from '$lib/server/chatMessage/deleteChatMessage'
import { deleteLlm } from '$lib/server/llm/deleteLlm'
import { endChat } from '$lib/server/chat/endChat'
import { findChat } from '$lib/server/chat/findChat'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { findChatConfigs } from '$lib/server/chatConfig/findChatConfigs'
import { findChatInfo } from '$lib/server/chat/findChatInfo'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'
import { findChats } from '$lib/server/chat/findChats'
import { findChatUiData } from '$lib/server/chat/findChatUiData'
import { findLlm } from '$lib/server/llm/findLlm'
import { findLlms } from '$lib/server/llm/findLlms'
import { findOrCreateUser } from '$lib/server/user/findOrCreateUser'
import { findUser } from '$lib/server/user/findUser'
import { findUserByEmail } from '$lib/server/user/findUserByEmail'
import { findUsers } from '$lib/server/user/findUsers'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'
import { getLatestUserMessageIdForChat } from '$lib/server/chat/getLatestUserMessageIdForChat'
import { importBedrockModels } from '$lib/server/bedrock/importBedrockModels'
import { importChatConfigs } from '$lib/server/chatConfig/importChatConfigs'
import { saveMultipleLlms } from '$lib/server/llm/saveMultipleLlms'
import { startServer } from '$lib/server/startServer'
import { updateChat } from '$lib/server/chat/updateChat'
import { updateChatConfig } from '$lib/server/chatConfig/updateChatConfig'
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage'
import { updateLlm } from '$lib/server/llm/updateLlm'
import { updateUser } from '$lib/server/user/updateUser'
import { upsertChat } from '$lib/server/chat/upsertChat'
import { upsertChatConfig } from '$lib/server/chatConfig/upsertChatConfig'
import { upsertChatMessage } from '$lib/server/chatMessage/upsertChatMessage'
import { upsertLlm } from '$lib/server/llm/upsertLlm'
import { upsertUser } from '$lib/server/user/upsertUser'
import dataStore from '$lib/server/dataStore';
import { findDefaultChatConfig } from '$lib/server/chatConfig/findDefaultChatConfig'
import { deleteUser } from '$lib/server/user/deleteUser'
import { findChatConfigByName } from '$lib/server/chatConfig/findChatConfigByName'
import { updateUserMetadata } from '$lib/server/user/updateUserMetadata'

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
    findChatUiData,
    findInfo: findChatInfo,
    findOne: findChat,
    getLatestUserMessageIdForChat,
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
  chatConfig: {
    create: createChatConfig,
    delete: deleteChatConfig,
    find: findChatConfigs,
    findByName: findChatConfigByName,
    findDefault: findDefaultChatConfig,
    findOne: findChatConfig,
    import: importChatConfigs,
    update: updateChatConfig,
    upsert: upsertChatConfig,
  },
  user: {
    create: createUser,
    delete: deleteUser,
    find: findUsers,
    findOne: findUser,
    findByEmail: findUserByEmail,
    findOrCreate: findOrCreateUser,
    update: updateUser,
    updateUserMetadata,
    upsert: upsertUser,
  }
};

export default operations;
