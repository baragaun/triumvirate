import type { Chat, ChatMessage } from '$lib/server/db/schema'

export function compileMessageForAi(chat: Chat, message: ChatMessage): string {
  if (chat.metadata) {
    return message.content + '<metadata>' + JSON.stringify(chat.metadata) + '</metadata>';
  }

  return message.content;
}
