import { describe, it } from 'vitest';
import './user/user.test';
import './chat/chat.test';
import './chatMessage/chatMessage.test';
import './llm/llm.test';
import './chatConfig/chatConfig.test';

describe('CRUD Operations Tests', () => {
  it('runs all CRUD operation tests', () => {
    // This is just a container test to group all the CRUD tests
    // The actual tests are imported above
  });
});
