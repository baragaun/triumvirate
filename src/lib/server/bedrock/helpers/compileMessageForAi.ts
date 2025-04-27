import type { Chat, ChatMessage } from '$lib/server/db/schema'
import { MessageRole } from '$lib/enums'

export function compileMessageForAi(
  chat: Chat,
  message: ChatMessage,
  isLatestUserMessage: boolean,
): string {
  // Add metadata if available, and if this is the user's most recent message
  if (
    !chat.metadata ||
    !isLatestUserMessage ||
    message.role !== MessageRole.user
  ) {
    return message.content;
  }

  return message.content + '<metadata>' + JSON.stringify(chat.metadata) + '</metadata>';
}
