import { describe, it, expect, vi, beforeEach } from 'vitest';
import '$lib/server/test/helpers/setup';
import { mockData } from '$lib/server/test/helpers/mockCrud';
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage';
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage';
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages';
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage';
import { deleteChatMessage } from '$lib/server/chatMessage/deleteChatMessage';
import { upsertChatMessage } from '$lib/server/chatMessage/upsertChatMessage';
import type { ChatMessage } from '$lib/server/db/schema';
import { MessageRole } from '$lib/enums';

describe('ChatMessage CRUD Operations', () => {
  describe('createChatMessage', () => {
    it('should create a new chat message', async () => {
      // Create a new chat message
      const result = await createChatMessage({
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'Hello, world!'
      }, false);

      // Verify the message was created
      expect(result).not.toBeNull();
      expect(result.chatMessages![0]!.content).toBe('Hello, world!');

      // Verify the message was added to the mock database
      expect(mockData.chatMessages.length).toBe(1);
      expect(mockData.chatMessages[0].content).toBe('Hello, world!');
    });
  });

  describe('findChatMessage', () => {
    it('should find a chat message by ID', async () => {
      // Add a mock message to the database
      mockData.chatMessages.push({
        id: 'message-id-123',
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'Hello, world!',
        sendToLlm: true,
        sendToUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatMessage);

      const result = await findChatMessage('message-id-123');

      // Verify the message was found
      expect(result).not.toBeNull();
      expect(result?.id).toBe('message-id-123');
    });

    it('should return null if message not found', async () => {
      const result = await findChatMessage('non-existent-id');

      // Verify null was returned
      expect(result).toBeNull();
    });
  });

  describe('findChatMessages', () => {
    it('should find all messages for a chat', async () => {
      // Add mock messages to the database
      mockData.chatMessages.push(
        {
          id: 'message-1',
          chatId: 'chat-id-123',
          role: MessageRole.user,
          content: 'Hello',
          sendToLlm: true,
          sendToUser: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as ChatMessage,
        {
          id: 'message-2',
          chatId: 'chat-id-123',
          role: MessageRole.assistant,
          content: 'Hi there!',
          sendToLlm: true,
          sendToUser: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as ChatMessage
      );

      const result = await findChatMessages('chat-id-123');

      // Verify messages were found
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('message-1');
      expect(result[1].id).toBe('message-2');
    });
  });

  describe('updateChatMessage', () => {
    it('should update a chat message', async () => {
      // Add a mock message to the database
      mockData.chatMessages.push({
        id: 'message-id-123',
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'Hello, world!',
        sendToLlm: true,
        sendToUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatMessage);

      const result = await updateChatMessage({
        id: 'message-id-123',
        content: 'Updated message'
      }, false);

      // Verify the message was updated
      expect(result.chatMessages![0].id).toBe('message-id-123');
      expect(result.chatMessages![0].content).toBe('Updated message');

      // Verify the message was updated in the mock database
      expect(mockData.chatMessages[0].content).toBe('Updated message');
    });

    it('should return an error if ID is not provided', async () => {
      const result = await updateChatMessage({ content: 'Updated message' }, false);

      // Verify error was returned
      expect(result.error).toBe('ChatMessage ID is required.');
    });
  });

  describe('deleteChatMessage', () => {
    it('should delete a chat message', async () => {
      // Add a mock message to the database
      mockData.chatMessages.push({
        id: 'message-id-123',
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'Hello, world!',
        sendToLlm: true,
        sendToUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatMessage);

      await deleteChatMessage('message-id-123');

      // Verify the message was deleted from the mock database
      expect(mockData.chatMessages.length).toBe(0);
    });
  });

  describe('upsertChatMessage', () => {
    it('should update an existing chat message', async () => {
      // Add a mock message to the database
      mockData.chatMessages.push({
        id: 'message-id-123',
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'Hello, world!',
        sendToLlm: true,
        sendToUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatMessage);

      await upsertChatMessage({
        id: 'message-id-123',
        content: 'Updated message'
      }, false);

      // Verify the message was updated in the mock database
      expect(mockData.chatMessages[0].content).toBe('Updated message');
    });

    it('should create a new chat message if it does not exist', async () => {
      await upsertChatMessage({
        id: 'new-message-123',
        chatId: 'chat-id-123',
        role: MessageRole.user,
        content: 'New message'
      }, false);

      // Verify the message was created in the mock database
      expect(mockData.chatMessages.length).toBe(1);
      expect(mockData.chatMessages[0].id).toBe('new-message-123');
      expect(mockData.chatMessages[0].content).toBe('New message');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(upsertChatMessage({ content: 'New message' }, false))
        .rejects.toThrow('upsertChatMessage: ID is required');
    });
  });
});
