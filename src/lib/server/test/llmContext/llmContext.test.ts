import { describe, it, expect, vi, beforeEach } from 'vitest';
import '$lib/server/test/helpers/setup';
import { mockData } from '$lib/server/test/helpers/mockCrud';
import { createChatConfig } from '$lib/server/chatConfig/createChatConfig';
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig';
import { findChatConfigs } from '$lib/server/chatConfig/findChatConfigs';
import { updateChatConfig } from '$lib/server/chatConfig/updateChatConfig';
import { deleteChatConfig } from '$lib/server/chatConfig/deleteChatConfig';
import { upsertChatConfig } from '$lib/server/chatConfig/upsertChatConfig';
import { importChatConfigs } from '$lib/server/chatConfig/importChatConfigs';
import type { ChatConfig } from '$lib/server/db/schema';

describe('ChatConfig CRUD Operations', () => {
  describe('createChatConfig', () => {
    it('should create a new CHAT config', async () => {
      // Create a new CHAT config
      const result = await createChatConfig({
        id: 'config-id-123',
        caption: 'Test Caption',
        description: 'Test Config',
        welcomeMessage: 'Welcome to the test',
        llmId: 'llm-id-123',
        llmInstructions: 'Test instructions',
        llmTemperature: 0.7,
        llmMaxTokens: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify the config was created
      expect(result.object).not.toBeNull();
      expect(result.object?.description).toBe('Test Config');

      // Verify the config was added to the mock database
      expect(mockData.chatConfigs.length).toBe(1);
      expect(mockData.chatConfigs[0].description).toBe('Test Config');
    });
  });

  describe('findChatConfig', () => {
    it('should find an CHAT config by ID', async () => {
      // Add a mock config to the database
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

      const result = await findChatConfig('config-id-123');

      // Verify the config was found
      expect(result).not.toBeNull();
      expect(result?.id).toBe('config-id-123');
    });

    it('should return null if config not found', async () => {
      const result = await findChatConfig('non-existent-id');

      // Verify null was returned
      expect(result).toBeNull();
    });
  });

  describe('findChatConfigs', () => {
    it('should find all CHAT configs', async () => {
      // Add mock configs to the database
      mockData.chatConfigs.push(
        {
          id: 'config-1',
          description: 'Config 1',
          llmId: 'llm-id-123',
          llmInstructions: 'Instructions 1',
          createdAt: new Date(),
          updatedAt: new Date()
        } as ChatConfig,
        {
          id: 'config-2',
          description: 'Config 2',
          llmId: 'llm-id-123',
          llmInstructions: 'Instructions 2',
          createdAt: new Date(),
          updatedAt: new Date()
        } as ChatConfig
      );

      const result = await findChatConfigs();

      // Verify configs were found
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('config-1');
      expect(result[1].id).toBe('config-2');
    });
  });

  describe('updateChatConfig', () => {
    it('should update an CHAT config', async () => {
      // Add a mock config to the database
      mockData.chatConfigs.push({
        id: 'config-id-123',
        description: 'Test Config',
        llmId: 'llm-id-123',
        llmInstructions: 'Test instructions',
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatConfig);

      const result = await updateChatConfig({
        id: 'config-id-123',
        description: 'Updated Config'
      });

      // Verify the config was updated
      expect(result.object?.id).toBe('config-id-123');
      expect(result.object?.description).toBe('Updated Config');

      // Verify the config was updated in the mock database
      expect(mockData.chatConfigs[0].description).toBe('Updated Config');
    });

    it('should return an error if ID is not provided', async () => {
      const result = await updateChatConfig({ description: 'Updated Config' });

      // Verify error was returned
      expect(result.error).toBe('ChatConfig ID is required.');
    });
  });

  describe('deleteChatConfig', () => {
    it('should delete an CHAT config', async () => {
      // Add a mock config to the database
      mockData.chatConfigs.push({
        id: 'config-id-123',
        description: 'Test Config',
        llmId: 'llm-id-123',
        llmInstructions: 'Test instructions',
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatConfig);

      await deleteChatConfig('config-id-123');

      // Verify the config was deleted from the mock database
      expect(mockData.chatConfigs.length).toBe(0);
    });
  });

  describe('upsertChatConfig', () => {
    it('should update an existing CHAT config', async () => {
      // Add a mock config to the database
      mockData.chatConfigs.push({
        id: 'config-id-123',
        description: 'Test Config',
        llmId: 'llm-id-123',
        llmInstructions: 'Test instructions',
        createdAt: new Date(),
        updatedAt: new Date()
      } as ChatConfig);

      await upsertChatConfig({
        id: 'config-id-123',
        description: 'Updated Config'
      });

      // Verify the config was updated in the mock database
      expect(mockData.chatConfigs[0].description).toBe('Updated Config');
    });

    it('should create a new CHAT config if it does not exist', async () => {
      await upsertChatConfig({
        id: 'new-config-123',
        description: 'New Config',
        llmId: 'llm-id-123',
        llmInstructions: 'New instructions'
      });

      // Verify the config was created in the mock database
      expect(mockData.chatConfigs.length).toBe(1);
      expect(mockData.chatConfigs[0].id).toBe('new-config-123');
      expect(mockData.chatConfigs[0].description).toBe('New Config');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(upsertChatConfig({ description: 'New Config' })).rejects.toThrow('upsertChatConfig: model ID is required');
    });
  });

  describe('importChatConfigs', () => {
    it('should import CHAT configs', async () => {
      await importChatConfigs();

      // Verify at least one config was imported
      expect(mockData.chatConfigs.length).toBeGreaterThan(0);
      expect(mockData.chatConfigs[0].id).toBe('default');
    });
  });
});
