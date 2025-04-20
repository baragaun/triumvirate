<script lang="ts">
  import type { Chat, ChatMessage, Llm } from '$lib/server/db/schema'
  import { ChatMode, MessageRole } from '$lib/enums'

  const {
    chat,
    message,
    replaced,
    llms,
    canEdit,
    canRegenerate,
    onEditMessage,
    onGenerateChatMessage
  } = $props<{
    chat: Chat,
    message: ChatMessage;
    replaced?: boolean;
    llms: Llm[],
    canEdit?: boolean;
    canRegenerate?: boolean;
    onEditMessage: (messageId: string, content: string) => void;
    onGenerateChatMessage: () => void;
  }>();

  // Derive values from message object
  const isUserMessage = message.role === MessageRole.user;

  const buildInfoLine = (): string => {
    const infoLineParts: string[] = [];

    if (message.role === MessageRole.assistant) {
      if (Array.isArray(llms) && llms.length > 0) {
        const llm = llms.find(llm => llm.id === message.llmId);
        if (llm) {
          infoLineParts.push(llm.name);
        }
      }

      if (infoLineParts.length < 1 && message.llmId) {
        if (message.llmId) {
          infoLineParts.push(message.llmId);
        } else {
          infoLineParts.push('Unknown model');
        }
      }

      if (message.llmTemperature !== null) {
        infoLineParts.push(`temperature: ${message.llmTemperature}`);
      }

      if (message.iteration !== null && message.iteration > 1) {
        infoLineParts.push(`iteration: ${message.iteration}`);
      }
    }

    return infoLineParts.length > 0 ? infoLineParts.join(' | ') : '';
  }
  const infoLine = $derived(buildInfoLine())
</script>

<div class="message-content {isUserMessage ? 'user-message' : 'assistant-message'}">
  <div class="message-text">
    {message.content}
    {#if chat.mode === ChatMode.edit && ((!isUserMessage && infoLine) || (isUserMessage && canEdit) || canRegenerate)}
      <div class="message-info {isUserMessage ? 'user-message-info' : ''}">
        {#if !isUserMessage && infoLine}
          <span>{infoLine}</span>
        {/if}

        <div class="message-actions {isUserMessage ? 'user-message-actions' : ''}">
          {#if canEdit}
            <button
              class="edit-button"
              onclick={() => onEditMessage(message.id, message.content)}
              title="Edit message"
              aria-label="Edit message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          {:else if canRegenerate}
            <button
              class="recycle-button"
              onclick={onGenerateChatMessage}
              title="Regenerate response"
              aria-label="Regenerate response"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
<style>
  .message-content {
    max-width: 80%;
    padding: 0.75rem 1rem 0.6rem;
    border-radius: 1rem;
    overflow-wrap: break-word;
  }

  .user-message {
    background-color: #e9f5ff;
    border-bottom-right-radius: 0.25rem;
  }

  .assistant-message {
    background-color: #f0f0f0;
    border-bottom-left-radius: 0.25rem;
  }

  /* Header styles removed for simplified UI */

  .message-text {
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .message-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.3rem;
    padding-top: 0.3rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.7rem;
    color: #666;
  }

  .message-info:empty {
    display: none;
  }

  .message-actions {
    display: flex;
    align-items: center;
  }

  .user-message-info {
    justify-content: flex-end;
  }

  .user-message-actions {
    margin-left: auto;
  }

  .edit-button,
  .recycle-button {
    background: none;
    border: none;
    color: #666;
    padding: 0;
    margin: 0;
    margin-left: 0.5rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .edit-button:hover {
    color: #2196f3;
  }

  .recycle-button:hover {
    color: #4caf50;
  }
</style>
