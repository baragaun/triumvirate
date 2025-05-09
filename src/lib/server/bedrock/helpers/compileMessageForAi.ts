import type { Chat, ChatMessage } from '$lib/server/db/schema'
import { MessageRole } from '$lib/enums'
import { getLlmFeedbackText } from '$lib/server/bedrock/helpers/getLlmFeedbackText'

export function compileMessageForAi(
  chat: Chat,
  messages: ChatMessage[],
  message: ChatMessage,
  index: number,
  isLatestUserMessage: boolean,
): string {
  const previousMessage = index > 1 ? messages[index - 1] : null;
  const userFeedbackText = previousMessage?.feedback
    ? getLlmFeedbackText(chat, previousMessage.feedback)
    : ''

  // Add metadata if available, and if this is the user's most recent message
  if (
    !chat.metadata ||
    !isLatestUserMessage ||
    message.role !== MessageRole.user
  ) {
    return message.content;
  }

  return (userFeedbackText ? userFeedbackText + '\n\n' : '') +
    message.content +
    '<metadata>' + JSON.stringify(chat.metadata) + '</metadata>';
}
