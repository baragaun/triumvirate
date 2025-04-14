import { vi, beforeEach, afterEach } from 'vitest';
import { resetMockData } from './mockCrud';
import { userMocks, chatMocks, chatMessageMocks, llmMocks, chatConfigMocks } from './mockCrud';

// Mock the user CRUD operations
vi.mock('$lib/server/user/createUser', () => ({
  createUser: userMocks.createUser
}));

vi.mock('$lib/server/user/findUser', () => ({
  findUser: userMocks.findUser
}));

vi.mock('$lib/server/user/findUsers', () => ({
  findUsers: userMocks.findUsers
}));

vi.mock('$lib/server/user/updateUser', () => ({
  updateUser: userMocks.updateUser
}));

vi.mock('$lib/server/user/upsertUser', () => ({
  upsertUser: userMocks.upsertUser
}));

// Mock the chat CRUD operations
vi.mock('$lib/server/chat/createChat', () => ({
  createChat: chatMocks.createChat
}));

vi.mock('$lib/server/chat/findChat', () => ({
  findChat: chatMocks.findChat
}));

vi.mock('$lib/server/chat/findChats', () => ({
  findChats: chatMocks.findChats
}));

vi.mock('$lib/server/chat/updateChat', () => ({
  updateChat: chatMocks.updateChat
}));

vi.mock('$lib/server/chat/deleteChat', () => ({
  deleteChat: chatMocks.deleteChat
}));

vi.mock('$lib/server/chat/upsertChat', () => ({
  upsertChat: chatMocks.upsertChat
}));

vi.mock('$lib/server/chat/endChat', () => ({
  endChat: chatMocks.endChat
}));

vi.mock('$lib/server/chat/findChatInfo', () => ({
  findChatInfo: chatMocks.findChatInfo
}));

// Mock the chatMessage CRUD operations
vi.mock('$lib/server/chatMessage/createChatMessage', () => ({
  createChatMessage: chatMessageMocks.createChatMessage
}));

vi.mock('$lib/server/chatMessage/findChatMessage', () => ({
  findChatMessage: chatMessageMocks.findChatMessage
}));

vi.mock('$lib/server/chatMessage/findChatMessages', () => ({
  findChatMessages: chatMessageMocks.findChatMessages
}));

vi.mock('$lib/server/chatMessage/updateChatMessage', () => ({
  updateChatMessage: chatMessageMocks.updateChatMessage
}));

vi.mock('$lib/server/chatMessage/deleteChatMessage', () => ({
  deleteChatMessage: chatMessageMocks.deleteChatMessage
}));

vi.mock('$lib/server/chatMessage/upsertChatMessage', () => ({
  upsertChatMessage: chatMessageMocks.upsertChatMessage
}));

// Mock the llm CRUD operations
vi.mock('$lib/server/llm/createLlm', () => ({
  createLlm: llmMocks.createLlm
}));

vi.mock('$lib/server/llm/findLlm', () => ({
  findLlm: llmMocks.findLlm
}));

vi.mock('$lib/server/llm/findLlms', () => ({
  findLlms: llmMocks.findLlms
}));

vi.mock('$lib/server/llm/updateLlm', () => ({
  updateLlm: llmMocks.updateLlm
}));

vi.mock('$lib/server/llm/deleteLlm', () => ({
  deleteLlm: llmMocks.deleteLlm
}));

vi.mock('$lib/server/llm/upsertLlm', () => ({
  upsertLlm: llmMocks.upsertLlm
}));

vi.mock('$lib/server/llm/saveMultipleLlms', () => ({
  saveMultipleLlms: llmMocks.saveMultipleLlms
}));

// Mock the chatConfig CRUD operations
vi.mock('$lib/server/chatConfig/createChatConfig', () => ({
  createChatConfig: chatConfigMocks.createChatConfig
}));

vi.mock('$lib/server/chatConfig/findChatConfig', () => ({
  findChatConfig: chatConfigMocks.findChatConfig
}));

vi.mock('$lib/server/chatConfig/findChatConfigs', () => ({
  findChatConfigs: chatConfigMocks.findChatConfigs
}));

vi.mock('$lib/server/chatConfig/updateChatConfig', () => ({
  updateChatConfig: chatConfigMocks.updateChatConfig
}));

vi.mock('$lib/server/chatConfig/deleteChatConfig', () => ({
  deleteChatConfig: chatConfigMocks.deleteChatConfig
}));

vi.mock('$lib/server/chatConfig/upsertChatConfig', () => ({
  upsertChatConfig: chatConfigMocks.upsertChatConfig
}));

vi.mock('$lib/server/chatConfig/importChatConfigs', () => ({
  importChatConfigs: chatConfigMocks.importChatConfigs
}));

// Mock the crypto API for generateId
vi.mock('$lib/server/helpers', () => ({
  generateId: vi.fn().mockImplementation(() => {
    // Generate a predictable ID based on the call count
    const callCount = vi.mocked(vi.fn()).mock.calls.length;
    return `test-id-${callCount}`;
  })
}));

// Reset mock data before each test
beforeEach(() => {
  resetMockData();
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  resetMockData();
  vi.clearAllMocks();
});
