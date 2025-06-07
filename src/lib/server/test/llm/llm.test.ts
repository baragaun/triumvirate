import { describe, it, expect, vi, beforeEach } from 'vitest';
import '$lib/server/test/helpers/setup';
import { mockData } from '$lib/server/test/helpers/mockCrud';
import { createLlm } from '$lib/server/llm/createLlm';
import { findLlm } from '$lib/server/llm/findLlm';
import { findLlms } from '$lib/server/llm/findLlms';
import { updateLlm } from '$lib/server/llm/updateLlm';
import { deleteLlm } from '$lib/server/llm/deleteLlm';
import { upsertLlm } from '$lib/server/llm/upsertLlm';
import { saveMultipleLlms } from '$lib/server/llm/saveMultipleLlms';
import type { Llm } from '$lib/server/db/schema';

describe('Llm CRUD Operations', () => {
  describe('createLlm', () => {
    it('should create a new LLM', async () => {
      // Create a new LLM
      const result = await createLlm({
        name: 'Test LLM',
        arn: 'llm-arn',
        provider: 'Test Provider',
        description: 'Test Description'
      });

      // Verify the LLM was created
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test LLM');
      expect(result?.arn).toBe('llm-arn');

      // Verify the LLM was added to the mock database
      expect(mockData.llms.length).toBe(1);
      expect(mockData.llms[0].name).toBe('Test LLM');
    });
  });

  describe('findLlm', () => {
    it('should find an LLM by ID', async () => {
      // Add a mock LLM to the database
      mockData.llms.push({
        id: 'llm-id-123',
        name: 'Test LLM',
        arn: 'llm-arn-123',
        provider: 'Test Provider',
        description: 'Test Description',
        isOnDemand: true,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Llm);

      const result = await findLlm('llm-id-123');

      // Verify the LLM was found
      expect(result).not.toBeNull();
      expect(result?.id).toBe('llm-id-123');
    });

    it('should return null if LLM not found', async () => {
      const result = await findLlm('non-existent-id');

      // Verify null was returned
      expect(result).toBeNull();
    });
  });

  describe('findLlms', () => {
    it('should find all LLMs', async () => {
      // Add mock LLMs to the database
      mockData.llms.push(
        {
          id: 'llm-1',
          name: 'LLM 1',
          arn: 'llm-arn-1',
          provider: 'Provider 1',
          isOnDemand: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Llm,
        {
          id: 'llm-2',
          name: 'LLM 2',
          arn: 'llm-arn-2',
          provider: 'Provider 2',
          isOnDemand: true,
          isActive: true,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Llm
      );

      const result = await findLlms();

      // Verify LLMs were found
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('llm-1');
      expect(result[1].id).toBe('llm-2');
    });
  });

  describe('updateLlm', () => {
    it('should update an LLM', async () => {
      // Add a mock LLM to the database
      mockData.llms.push({
        id: 'llm-id-123',
        name: 'Test LLM',
        arn: 'llm-arn-123',
        provider: 'Test Provider',
        isOnDemand: true,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Llm);

      await updateLlm({
        id: 'llm-id-123',
        name: 'Updated LLM'
      });

      // Verify the LLM was updated in the mock database
      expect(mockData.llms[0].name).toBe('Updated LLM');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(updateLlm({ name: 'Updated LLM' })).rejects.toThrow('LLM ID is required');
    });
  });

  describe('deleteLlm', () => {
    it('should delete an LLM', async () => {
      // Add a mock LLM to the database
      mockData.llms.push({
        id: 'llm-id-123',
        name: 'Test LLM',
        arn: 'llm-arn-123',
        provider: 'Test Provider',
        isOnDemand: true,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Llm);

      await deleteLlm('llm-id-123');

      // Verify the LLM was deleted from the mock database
      expect(mockData.llms.length).toBe(0);
    });
  });

  describe('upsertLlm', () => {
    it('should update an existing LLM', async () => {
      // Add a mock LLM to the database
      mockData.llms.push({
        id: 'llm-id-123',
        name: 'Test LLM',
        arn: 'llm-arn-123',
        provider: 'Test Provider',
        isOnDemand: true,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Llm);

      await upsertLlm({
        id: 'llm-id-123',
        name: 'Updated LLM'
      });

      // Verify the LLM was updated in the mock database
      expect(mockData.llms[0].name).toBe('Updated LLM');
    });

    it('should create a new LLM if it does not exist', async () => {
      await upsertLlm({
        id: 'new-llm-123',
        name: 'New LLM',
        arn: 'new-arn-123',
        provider: 'New Provider'
      });

      // Verify the LLM was created in the mock database
      expect(mockData.llms.length).toBe(1);
      expect(mockData.llms[0].id).toBe('new-llm-123');
      expect(mockData.llms[0].name).toBe('New LLM');
      expect(mockData.llms[0].arn).toBe('new-arn-123');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(upsertLlm({ name: 'New LLM' })).rejects.toThrow('upsertLlm: ID is required');
    });
  });

  describe('saveMultipleLlms', () => {
    it('should save multiple LLMs', async () => {
      const llms = [
        {
          id: 'llm-1',
          name: 'LLM 1',
          arn: 'llm-arn-1',
          provider: 'Provider 1',
          description: 'Description 1',
          tokenCost: 0,
          inputTokenCost: 0,
          outputTokenCost: 0,
          isOnDemand: true,
          isActive: true,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'llm-2',
          name: 'LLM 2',
          arn: 'llm-arn-2',
          provider: 'Provider 2',
          description: 'Description 2',
          tokenCost: 0,
          inputTokenCost: 0,
          outputTokenCost: 0,
          isOnDemand: true,
          isActive: true,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      await saveMultipleLlms(llms);

      // Verify the LLMs were saved in the mock database
      expect(mockData.llms.length).toBe(2);
      expect(mockData.llms[0].id).toBe('llm-1');
      expect(mockData.llms[1].arn).toBe('llm-arn-2');
    });
  });
});
