import { vi } from 'vitest';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Mock data storage
const mockData: Record<string, any[]> = {
  users: [],
  chats: [],
  chat_messages: [],
  llms: [],
  chat_configs: []
};

// Reset all mock data
export function resetMockData() {
  Object.keys(mockData).forEach(key => {
    mockData[key] = [];
  });
}

// Helper to find items by ID
function findById(items: any[], id: string): any | null {
  return items.find(item => item.id === id) || null;
}

// Create a simplified mock database that directly implements the functions we need
const mockDb = {
  // Generic insert function
  insert: (table: any) => {
    return {
      values: (data: any) => {
        const tableName = table.name;
        if (!mockData[tableName]) {
          mockData[tableName] = [];
        }

        if (Array.isArray(data)) {
          mockData[tableName].push(...data);
        } else {
          mockData[tableName].push(data);
        }
        return Promise.resolve();
      }
    };
  },

  // Generic select function
  select: () => {
    return {
      from: (table: any) => {
        const tableName = table.name;

        // Add orderBy method
        const result = {
          where: (condition: any) => {
            // Handle eq condition
            if (condition && condition.left && condition.operator === '=') {
              const fieldName = condition.left.name;
              const value = condition.right;
              const filtered = (mockData[tableName] || []).filter(item => item[fieldName] === value);

              return {
                limit: (limit: number) => Promise.resolve(filtered.slice(0, limit))
              };
            }

            return {
              limit: (limit: number) => Promise.resolve((mockData[tableName] || []).slice(0, limit))
            };
          },
          limit: (limit: number) => Promise.resolve((mockData[tableName] || []).slice(0, limit)),
          orderBy: () => result // Return self to allow chaining
        };

        return result;
      }
    };
  },

  // Generic update function
  update: (table: any) => {
    return {
      set: (changes: any) => {
        return {
          where: (condition: any) => {
            const tableName = table.name;
            if (!mockData[tableName]) {
              mockData[tableName] = [];
            }

            // Handle eq condition
            if (condition && condition.left && condition.operator === '=') {
              const fieldName = condition.left.name;
              const value = condition.right;

              mockData[tableName] = mockData[tableName].map(item => {
                if (item[fieldName] === value) {
                  return { ...item, ...changes };
                }
                return item;
              });
            }

            return Promise.resolve();
          }
        };
      }
    };
  },

  // Generic delete function
  delete: (table: any) => {
    return {
      where: (condition: any) => {
        const tableName = table.name;
        if (!mockData[tableName]) {
          mockData[tableName] = [];
        }

        // Handle eq condition
        if (condition && condition.left && condition.operator === '=') {
          const fieldName = condition.left.name;
          const value = condition.right;

          mockData[tableName] = mockData[tableName].filter(item => item[fieldName] !== value);
        } else {
          // If no condition, clear the table
          mockData[tableName] = [];
        }

        return Promise.resolve();
      }
    };
  },

  // Mock SQL execution
  execute: (sql: any) => Promise.resolve()
};

// Mock dataStore
export const mockDataStore = {
  isStarted: vi.fn().mockReturnValue(true),
  setStarted: vi.fn(),
  db: {
    get: vi.fn().mockReturnValue(mockDb)
  }
};

// Helper to add mock data directly
export function addMockData(tableName: string, data: any) {
  if (!mockData[tableName]) {
    mockData[tableName] = [];
  }

  if (Array.isArray(data)) {
    mockData[tableName].push(...data);
  } else {
    mockData[tableName].push(data);
  }
}

// Helper to get mock data directly
export function getMockData(tableName: string) {
  return mockData[tableName] || [];
}
