import type { Chat, ChatMessage } from '$lib/server/db/schema'
import { compileMessageForAi } from '$lib/server/bedrock/helpers/compileMessageForAi'
import { getLatestUserMessageIdForChat } from '$lib/server/chat/getLatestUserMessageIdForChat'

export function formatPromptForModel(
  chat: Chat,
  messages: ChatMessage[],
  llmId: string,
): string | object | Array<{role: string, content: string}> {
  const latestUserMessageId = getLatestUserMessageIdForChat(messages);

  if (llmId.includes('anthropic.claude')) {
    // Format for Claude models
    // { role: 'user' | 'assistant'; content: string }
    return messages.map((m) => ({
      role: m.role,
      content: compileMessageForAi(chat, m, m.id === latestUserMessageId)
    }));
  } else if (llmId.includes('amazon.titan')) {
    // Format for Titan models
    return {
      inputText: messages.map((m) => `${m.role}: ${compileMessageForAi(chat, m, m.id === latestUserMessageId)}`)
        .join('\n')
    };
  } else if (llmId.includes('amazon.nova')) {
    // Format for Nova models (both Pro and Lite)
    return messages.map((m) => ({
      role: m.role,
      content: [{ text: compileMessageForAi(chat, m, m.id === latestUserMessageId) }]
    }));
  } else if (llmId.includes('meta.llama')) {
    // Format for Llama models
    return messages.map((m) => `${m.role}: ${compileMessageForAi(chat, m, m.id === latestUserMessageId)}`)
      .join('\n');
  } else {
    // Default format
    return messages.map((m) => `${m.role}: ${compileMessageForAi(chat, m, m.id === latestUserMessageId)}`)
      .join('\n');
  }
}
