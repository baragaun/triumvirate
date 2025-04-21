import { describe, it, expect, vi, beforeEach } from 'vitest';
import '$lib/server/test/helpers/setup';
import { mockData } from '$lib/server/test/helpers/mockCrud';
import { createUser } from '$lib/server/user/createUser';
import { findUser } from '$lib/server/user/findUser';
import { findUsers } from '$lib/server/user/findUsers';
import { updateUser } from '$lib/server/user/updateUser';
import { upsertUser } from '$lib/server/user/upsertUser';
import type { User } from '$lib/server/db/schema';

describe('User CRUD Operations', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      // Create a new user
      const result = await createUser({ username: 'testuser' });

      // Verify the user was created
      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');

      // Verify the user was added to the mock database
      expect(mockData.users.length).toBe(1);
      expect(mockData.users[0].username).toBe('testuser');
    });
  });

  describe('findUser', () => {
    it('should find a user by ID', async () => {
      // Add a mock user to the database
      mockData.users.push({
        id: 'test-id-123',
        username: 'testuser',
        passwordHash: 'mock-hash',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User);

      const result = await findUser('test-id-123');

      // Verify the user was found
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-id-123');
    });

    it('should return null if user not found', async () => {
      const result = await findUser('non-existent-id');

      // Verify null was returned
      expect(result).toBeNull();
    });
  });

  describe('findUsers', () => {
    it('should find all users', async () => {
      // Add mock users to the database
      mockData.users.push(
        {
          id: 'user-1',
          username: 'user1',
          passwordHash: 'hash1',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User,
        {
          id: 'user-2',
          username: 'user2',
          passwordHash: 'hash2',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User
      );

      const result = await findUsers();

      // Verify users were found
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      // Add a mock user to the database
      mockData.users.push({
        id: 'test-id-123',
        username: 'testuser',
        passwordHash: 'mock-hash',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User);

      // Update the user
      await updateUser({
        id: 'test-id-123',
        username: 'updated-user'
      });

      // Verify the user was updated in the mock database
      expect(mockData.users[0].username).toBe('updated-user');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(updateUser({ username: 'updated-user' })).rejects.toThrow('User ID is required');
    });
  });

  describe('upsertUser', () => {
    it('should update an existing user', async () => {
      // Add a mock user to the database
      mockData.users.push({
        id: 'test-id-123',
        username: 'testuser',
        passwordHash: 'mock-hash',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User);

      await upsertUser({
        id: 'test-id-123',
        username: 'updated-user'
      });

      // Verify the user was updated in the mock database
      expect(mockData.users[0].username).toBe('updated-user');
    });

    it('should create a new user if it does not exist', async () => {
      await upsertUser({
        id: 'new-id-123',
        username: 'new-user'
      });

      // Verify the user was created in the mock database
      expect(mockData.users.length).toBe(1);
      expect(mockData.users[0].id).toBe('new-id-123');
      expect(mockData.users[0].username).toBe('new-user');
    });

    it('should throw an error if ID is not provided', async () => {
      await expect(upsertUser({ username: 'new-user' })).rejects.toThrow('upsertUser: ID is required');
    });
  });
});
