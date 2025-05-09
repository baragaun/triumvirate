import type { Chat, ChatMessage } from '$lib/server/db/schema'

export function getLlmFeedbackText(chat: Chat, feedbackValue: string): string | null {
  if (!chat || !feedbackValue) {
    return null;
  }

  if (feedbackValue === chat.feedbackButtonValue0) {
    return chat.feedbackButtonLlmText0;
  }
  if (feedbackValue === chat.feedbackButtonValue1) {
    return chat.feedbackButtonLlmText1;
  }
  if (feedbackValue === chat.feedbackButtonValue2) {
    return chat.feedbackButtonLlmText2;
  }
  if (feedbackValue === chat.feedbackButtonValue3) {
    return chat.feedbackButtonLlmText3;
  }
  if (feedbackValue === chat.feedbackButtonValue4) {
    return chat.feedbackButtonLlmText4;
  }

  return null;
}
