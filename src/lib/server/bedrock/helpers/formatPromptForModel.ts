import type { ChatMessage } from '$lib/server/db/schema'

export function formatPromptForModel(
  llmId: string,
  messages: ChatMessage[]
): string | object | Array<{role: string, content: string}> {
  if (llmId.includes('anthropic.claude')) {
    // Format for Claude llms
    // { role: 'user' | 'assistant'; content: string }
    return messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  } else if (llmId.includes('amazon.titan')) {
    // Format for Titan llms
    return {
      inputText: messages.map(m => `${m.role}: ${m.content}`).join('\n')
    };
  } else if (llmId.includes('amazon.nova')) {
    // Format for Nova llms (both Pro and Lite)
    return messages.map(message => ({
      role: message.role,
      content: [{ text: message.content }]
    }));
  } else if (llmId.includes('meta.llama')) {
    // Format for Llama llms
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  } else {
    // Default format
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  }
}
