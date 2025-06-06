import { vi } from 'vitest';
import type { User, Chat, ChatMessage, Llm, ChatConfig } from '$lib/server/db/schema';

// Mock data storage
export const mockData = {
  users: [] as User[],
  chats: [] as Chat[],
  chatMessages: [] as ChatMessage[],
  llms: [] as Llm[],
  chatConfigs: [] as ChatConfig[]
};

// Reset all mock data
export function resetMockData() {
  mockData.users = [];
  mockData.chats = [];
  mockData.chatMessages = [];
  mockData.llms = [];
  mockData.chatConfigs = [];
}

// User CRUD mocks
export const userMocks = {
  createUser: vi.fn().mockImplementation((userData: Partial<User>) => {
    const user = {
      id: userData.id || `test-id-${mockData.users.length + 1}`,
      name: userData.name || 'testuser',
      email: userData.email || 'test@test.com',
      passwordHash: userData.passwordHash || 'mock-hash',
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date()
    } as User;

    mockData.users.push(user);
    return Promise.resolve(user);
  }),

  findUser: vi.fn().mockImplementation((id: string) => {
    const user = mockData.users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }),

  findUsers: vi.fn().mockImplementation(() => {
    return Promise.resolve([...mockData.users]);
  }),

  updateUser: vi.fn().mockImplementation((userData: Partial<User>) => {
    if (!userData.id) {
      return Promise.reject(new Error('User ID is required'));
    }

    const index = mockData.users.findIndex(u => u.id === userData.id);
    if (index >= 0) {
      mockData.users[index] = { ...mockData.users[index], ...userData, updatedAt: new Date() };
    }

    return Promise.resolve();
  }),

  upsertUser: vi.fn().mockImplementation((userData: Partial<User>) => {
    if (!userData.id) {
      return Promise.reject(new Error('upsertUser: ID is required'));
    }

    const index = mockData.users.findIndex(u => u.id === userData.id);
    if (index >= 0) {
      // Update existing user
      mockData.users[index] = { ...mockData.users[index], ...userData, updatedAt: new Date() };
      return Promise.resolve(mockData.users[index]);
    } else {
      // Create new user
      return userMocks.createUser(userData);
    }
  })
};

// Chat CRUD mocks
export const chatMocks = {
  createChat: vi.fn().mockImplementation((chatData: Partial<Chat>) => {
    const chat = {
      id: chatData.id || `chat-id-${mockData.chats.length + 1}`,
      title: chatData.title || 'Test Chat',
      userId: chatData.userId || 'user-id-1',
      userName: chatData.userName || 'testuser',
      llmId: chatData.llmId || 'llm-id-1',
      configId: chatData.configId || 'config-id-1',
      createdAt: chatData.createdAt || new Date(),
      updatedAt: chatData.updatedAt || new Date()
    } as Chat;

    mockData.chats.push(chat);
    return Promise.resolve({ chat });
  }),

  findChat: vi.fn().mockImplementation((id: string) => {
    const chat = mockData.chats.find(c => c.id === id);
    return Promise.resolve(chat || null);
  }),

  findChats: vi.fn().mockImplementation(() => {
    return Promise.resolve([...mockData.chats]);
  }),

  updateChat: vi.fn().mockImplementation((chatData: Partial<Chat>) => {
    if (!chatData.id) {
      return Promise.resolve({ error: 'Chat ID is required.' });
    }

    const index = mockData.chats.findIndex(c => c.id === chatData.id);
    if (index >= 0) {
      mockData.chats[index] = { ...mockData.chats[index], ...chatData, updatedAt: new Date() };
      return Promise.resolve({ object: mockData.chats[index] });
    }

    return Promise.resolve({ error: 'Chat not found.' });
  }),

  deleteChat: vi.fn().mockImplementation((id: string) => {
    const index = mockData.chats.findIndex(c => c.id === id);
    if (index >= 0) {
      mockData.chats.splice(index, 1);
    }

    return Promise.resolve();
  }),

  upsertChat: vi.fn().mockImplementation((chatData: Partial<Chat>) => {
    if (!chatData.id) {
      return Promise.reject(new Error('upsertChat: ID is required'));
    }

    const index = mockData.chats.findIndex(c => c.id === chatData.id);
    if (index >= 0) {
      // Update existing chat
      return chatMocks.updateChat(chatData);
    } else {
      // Create new chat
      return chatMocks.createChat(chatData);
    }
  }),

  endChat: vi.fn().mockImplementation((id: string, title: string, rating: number) => {
    const index = mockData.chats.findIndex(c => c.id === id);
    if (index >= 0) {
      mockData.chats[index] = {
        ...mockData.chats[index],
        title,
        rating,
        endedAt: new Date(),
        updatedAt: new Date()
      };
    }

    return Promise.resolve();
  }),

  findChatInfo: vi.fn().mockImplementation((id: string) => {
    const chat = mockData.chats.find(c => c.id === id);
    if (!chat) {
      return Promise.resolve({ error: 'not-found' });
    }

    const chatConfig = mockData.chatConfigs.find(c => c.id === chat.configId) || null;
    const chatMessages = mockData.chatMessages.filter(m => m.chatId === id);

    return Promise.resolve({
      chat,
      chatConfig,
      chatMessages
    });
  })
};

// ChatMessage CRUD mocks
export const chatMessageMocks = {
  createChatMessage: vi.fn().mockImplementation((messageData: Partial<ChatMessage>, shouldFindMessage = true) => {
    const message = {
      id: messageData.id || `message-id-${mockData.chatMessages.length + 1}`,
      chatId: messageData.chatId || 'chat-id-1',
      role: messageData.role,
      content: messageData.content || '',
      sendToLlm: messageData.sendToLlm !== undefined ? messageData.sendToLlm : true,
      sendToUser: messageData.sendToUser !== undefined ? messageData.sendToUser : true,
      replaced: messageData.replaced !== undefined ? messageData.replaced : false,
      createdAt: messageData.createdAt || new Date(),
      updatedAt: messageData.updatedAt || new Date()
    } as ChatMessage;

    mockData.chatMessages.push(message);
    return Promise.resolve(message);
  }),

  findChatMessage: vi.fn().mockImplementation((id: string) => {
    const message = mockData.chatMessages.find(m => m.id === id);
    return Promise.resolve(message || null);
  }),

  findChatMessages: vi.fn().mockImplementation((chatId: string) => {
    const messages = mockData.chatMessages.filter(m => m.chatId === chatId);
    return Promise.resolve(messages);
  }),

  updateChatMessage: vi.fn().mockImplementation((messageData: Partial<ChatMessage>) => {
    if (!messageData.id) {
      return Promise.resolve({ error: 'ChatMessage ID is required.' });
    }

    const index = mockData.chatMessages.findIndex(m => m.id === messageData.id);
    if (index >= 0) {
      mockData.chatMessages[index] = { ...mockData.chatMessages[index], ...messageData, updatedAt: new Date() };
      return Promise.resolve({ object: mockData.chatMessages[index] });
    }

    return Promise.resolve({ error: 'ChatMessage not found.' });
  }),

  deleteChatMessage: vi.fn().mockImplementation((id: string) => {
    const index = mockData.chatMessages.findIndex(m => m.id === id);
    if (index >= 0) {
      mockData.chatMessages.splice(index, 1);
    }

    return Promise.resolve();
  }),

  upsertChatMessage: vi.fn().mockImplementation((messageData: Partial<ChatMessage>) => {
    if (!messageData.id) {
      return Promise.reject(new Error('upsertChatMessage: ID is required'));
    }

    const index = mockData.chatMessages.findIndex(m => m.id === messageData.id);
    if (index >= 0) {
      // Update existing message
      return chatMessageMocks.updateChatMessage(messageData);
    } else {
      // Create new message
      return chatMessageMocks.createChatMessage(messageData, false);
    }
  })
};

// Llm CRUD mocks
export const llmMocks = {
  createLlm: vi.fn().mockImplementation((llmData: Partial<Llm>) => {
    const llm = {
      id: llmData.id || `llm-id-${mockData.llms.length + 1}`,
      name: llmData.name || 'Test LLM',
      provider: llmData.provider || 'Test Provider',
      description: llmData.description || 'Test Description',
      isOnDemand: llmData.isOnDemand !== undefined ? llmData.isOnDemand : true,
      isActive: llmData.isActive !== undefined ? llmData.isActive : true,
      isAvailable: llmData.isAvailable !== undefined ? llmData.isAvailable : true,
      createdAt: llmData.createdAt || new Date(),
      updatedAt: llmData.updatedAt || new Date()
    } as Llm;

    mockData.llms.push(llm);
    return Promise.resolve(llm);
  }),

  findLlm: vi.fn().mockImplementation((id: string) => {
    const llm = mockData.llms.find(l => l.id === id);
    return Promise.resolve(llm || null);
  }),

  findLlms: vi.fn().mockImplementation(() => {
    return Promise.resolve([...mockData.llms]);
  }),

  updateLlm: vi.fn().mockImplementation((llmData: Partial<Llm>) => {
    if (!llmData.id) {
      return Promise.reject(new Error('LLM ID is required'));
    }

    const index = mockData.llms.findIndex(l => l.id === llmData.id);
    if (index >= 0) {
      mockData.llms[index] = { ...mockData.llms[index], ...llmData, updatedAt: new Date() };
    }

    return Promise.resolve();
  }),

  deleteLlm: vi.fn().mockImplementation((id: string) => {
    const index = mockData.llms.findIndex(l => l.id === id);
    if (index >= 0) {
      mockData.llms.splice(index, 1);
    }

    return Promise.resolve();
  }),

  upsertLlm: vi.fn().mockImplementation((llmData: Partial<Llm>) => {
    if (!llmData.id) {
      return Promise.reject(new Error('upsertLlm: ID is required'));
    }

    const index = mockData.llms.findIndex(l => l.id === llmData.id);
    if (index >= 0) {
      // Update existing LLM
      return llmMocks.updateLlm(llmData);
    } else {
      // Create new LLM
      return llmMocks.createLlm(llmData);
    }
  }),

  saveMultipleLlms: vi.fn().mockImplementation((llms: Partial<Llm>[]) => {
    const promises = llms.map(llm => llmMocks.upsertLlm(llm));
    return Promise.all(promises);
  })
};

// ChatConfig CRUD mocks
export const chatConfigMocks = {
  createChatConfig: vi.fn().mockImplementation((configData: Partial<ChatConfig>) => {
    const config = {
      id: configData.id || `config-id-${mockData.chatConfigs.length + 1}`,
      description: configData.description || 'Test Config',
      welcomeMessage: configData.welcomeMessage || 'Welcome to the test',
      llmId: configData.llmId || 'llm-id-1',
      llmInstructions: configData.llmInstructions || 'Test instructions',
      llmTemperature: configData.llmTemperature !== undefined ? configData.llmTemperature : 0.7,
      llmMaxTokens: configData.llmMaxTokens !== undefined ? configData.llmMaxTokens : 1000,
      createdAt: configData.createdAt || new Date(),
      updatedAt: configData.updatedAt || new Date()
    } as ChatConfig;

    mockData.chatConfigs.push(config);
    return Promise.resolve({ object: config });
  }),

  findChatConfig: vi.fn().mockImplementation((id: string) => {
    const config = mockData.chatConfigs.find(c => c.id === id);
    return Promise.resolve(config || null);
  }),

  findChatConfigs: vi.fn().mockImplementation(() => {
    return Promise.resolve([...mockData.chatConfigs]);
  }),

  updateChatConfig: vi.fn().mockImplementation((configData: Partial<ChatConfig>) => {
    if (!configData.id) {
      return Promise.resolve({ error: 'ChatConfig ID is required.' });
    }

    const index = mockData.chatConfigs.findIndex(c => c.id === configData.id);
    if (index >= 0) {
      mockData.chatConfigs[index] = { ...mockData.chatConfigs[index], ...configData, updatedAt: new Date() };
      return Promise.resolve({ object: mockData.chatConfigs[index] });
    }

    return Promise.resolve({ error: 'ChatConfig not found.' });
  }),

  deleteChatConfig: vi.fn().mockImplementation((id: string) => {
    const index = mockData.chatConfigs.findIndex(c => c.id === id);
    if (index >= 0) {
      mockData.chatConfigs.splice(index, 1);
    }

    return Promise.resolve();
  }),

  upsertChatConfig: vi.fn().mockImplementation((configData: Partial<ChatConfig>) => {
    if (!configData.id) {
      return Promise.reject(new Error('upsertChatConfig: model ID is required'));
    }

    const index = mockData.chatConfigs.findIndex(c => c.id === configData.id);
    if (index >= 0) {
      // Update existing config
      return chatConfigMocks.updateChatConfig(configData);
    } else {
      // Create new config
      return chatConfigMocks.createChatConfig(configData);
    }
  }),

  importChatConfigs: vi.fn().mockImplementation(() => {
    // Mock implementation of importing default configs
    const defaultConfig = {
      id: 'default',
      description: 'Default Config',
      welcomeMessage: 'Welcome to the default config',
      llmId: 'default-llm',
      llmInstructions: 'Default instructions',
      llmTemperature: 0.7,
      llmMaxTokens: 1000
    };

    return chatConfigMocks.upsertChatConfig(defaultConfig);
  })
};
