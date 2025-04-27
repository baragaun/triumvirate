import type { ChatMessage } from '$lib/server/db/schema'
import { MessageRole } from '$lib/enums'

export function getLatestUserMessageIdForChat(messages: ChatMessage[]): string | null {
  if (!Array.isArray(messages) || messages.length < 1) {
    return null;
  }

  const userMessages = messages.filter(m => m.role === MessageRole.user);

  if (userMessages.length < 1) {
    return null;
  }

  return userMessages[userMessages.length - 1].id;
}
