import { describe, it, expect, vi, beforeEach } from 'vitest';
import '$lib/server/test/helpers/setup';
import { mockData } from '$lib/server/test/helpers/mockCrud';
import { createChat } from '$lib/server/chat/createChat';
import { findChat } from '$lib/server/chat/findChat';
import { findChats } from '$lib/server/chat/findChats';
import { updateChat } from '$lib/server/chat/updateChat';
import { deleteChat } from '$lib/server/chat/deleteChat';
import { upsertChat } from '$lib/server/chat/upsertChat';
import { endChat } from '$lib/server/chat/endChat';
import { findChatInfo } from '$lib/server/chat/findChatInfo';
import type { Chat, ChatConfig } from '$lib/server/db/schema';

describe('Chat CRUD Operations', () => {
  describe('createChat', () => {
    it('should create a new chat', async () => {
      // Create a new chat
      const result = await createChat({
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123'
      });

      // Verify the chat was created
      expect(result).not.toBeNull();
      expect(result.chat?.title).toBe('Test Chat');

      // Verify the chat was added to the mock database
      expect(mockData.chats.length).toBe(1);
      expect(mockData.chats[0].title).toBe('Test Chat');
    });
  });

  describe('findChat', () => {
    it('should find a chat by ID', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        configId: 'config-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      const result = await findChat('chat-id-123');

      // Verify the chat was found
      expect(result).not.toBeNull();
      expect(result?.id).toBe('chat-id-123');
    });

    it('should return null if chat not found', async () => {
      const result = await findChat('non-existent-id');

      // Verify null was returned
      expect(result).toBeNull();
    });
  });

  describe('findChats', () => {
    it('should find all chats', async () => {
      // Add mock chats to the database
      mockData.chats.push(
        {
          id: 'chat-1',
          title: 'Chat 1',
          userId: 'user-id-123',
          username: 'testuser',
          llmId: 'llm-id-123',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Chat,
        {
          id: 'chat-2',
          title: 'Chat 2',
          userId: 'user-id-123',
          username: 'testuser',
          llmId: 'llm-id-123',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Chat
      );

      const result = await findChats();

      // Verify chats were found
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('chat-1');
      expect(result[1].id).toBe('chat-2');
    });
  });

  describe('updateChat', () => {
    it('should update a chat', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      const result = await updateChat({
        id: 'chat-id-123',
        title: 'Updated Chat'
      });

      // Verify the chat was updated
      expect(result.object?.id).toBe('chat-id-123');
      expect(result.object?.title).toBe('Updated Chat');

      // Verify the chat was updated in the mock database
      expect(mockData.chats[0].title).toBe('Updated Chat');
    });

    it('should return an error if ID is not provided', async () => {
      const result = await updateChat({ title: 'Updated Chat' });

      // Verify error was returned
      expect(result.error).toBe('Chat ID is required.');
    });
  });

  describe('deleteChat', () => {
    it('should delete a chat', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      await deleteChat('chat-id-123');

      // Verify the chat was deleted from the mock database
      expect(mockData.chats.length).toBe(0);
    });
  });

  describe('endChat', () => {
    it('should end a chat', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      await endChat('chat-id-123', 'Great chat!', 5);

      // Verify the chat was updated in the mock database
      expect(mockData.chats[0].title).toBe('Test Chat');
      expect(mockData.chats[0].rating).toBe(5);
      expect(mockData.chats[0].endedAt).toBeDefined();
    });
  });

  describe('upsertChat', () => {
    it('should update an existing chat', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      await upsertChat({
        id: 'chat-id-123',
        title: 'Updated Chat'
      });

      // Verify the chat was updated in the mock database
      expect(mockData.chats[0].title).toBe('Updated Chat');
    });

    it('should create a new chat if it does not exist', async () => {
      await upsertChat({
        id: 'new-chat-123',
        title: 'New Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123'
      });

      // Verify the chat was created in the mock database
      expect(mockData.chats.length).toBe(1);
      expect(mockData.chats[0].id).toBe('new-chat-123');
      expect(mockData.chats[0].title).toBe('New Chat');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(upsertChat({ title: 'New Chat' })).rejects.toThrow('upsertChat: ID is required');
    });
  });

  describe('findChatInfo', () => {
    it('should find chat info', async () => {
      // Add a mock chat to the database
      mockData.chats.push({
        id: 'chat-id-123',
        title: 'Test Chat',
        userId: 'user-id-123',
        username: 'testuser',
        llmId: 'llm-id-123',
        configId: 'config-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Chat);

      // Add a mock chat config
      mockData.chatConfigs.push({
        id: 'config-id-123',
        description: 'Test Config',
        welcomeMessage: 'Welcome to the test',
        llmId: 'llm-id-123',
        llmInstructions: 'Test instructions',
        llmTemperature: 0.7,
        llmMaxTokens: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatConfig);

      const result = await findChatInfo('chat-id-123');

      // Verify chat info was found
      expect(result.chat).not.toBeNull();
      expect(result.chat?.id).toBe('chat-id-123');
      expect(result.chatConfig).not.toBeNull();
      expect(result.chatConfig?.id).toBe('config-id-123');
      expect(result.chatMessages).toEqual([]);
    });

    it('should return error if chat not found', async () => {
      const result = await findChatInfo('non-existent-id');

      // Verify error was returned
      expect(result.error).toBe('not-found');
    });
  });
});
