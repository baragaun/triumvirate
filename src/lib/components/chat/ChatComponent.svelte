<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import type { Chat, ChatConfig, ChatMessage, Llm, User } from '$lib/server/db/schema';
  import type {
    ChangeChatMessageResponse,
    GenerateChatMessageResponse,
  } from '$lib/types';
  import { ChatMode, MessageRole } from '$lib/enums';
  import ChatConfigModal from './ChatConfigModal.svelte';
  import MessageBubble from './MessageBubble.svelte';

  let {
    chat,
    chatMessages = $bindable<ChatMessage[]>(),
    chatConfig,
    chatConfigs,
    llms,
    deleteChat,
    updateChat,
    updateChatMessage,
    updateChatConfig,
    onEndChat,
  } = $props<{
    chat: Chat;
    chatMessages: ChatMessage[];
    chatConfig: ChatConfig | null;
    chatConfigs: ChatConfig[];
    llms: Llm[];
    deleteChat: () => Promise<void>;
    updateChat: (changes: Partial<Chat>) => Promise<string>;
    updateChatMessage: (changes: Partial<ChatMessage>) => Promise<string>;
    updateChatConfig: (changes: Partial<ChatConfig>) => Promise<string>;
    onEndChat: () => void;
  }>();

  const user = getContext<User | null>('user');

  // Wrapper for deleteChat that adds confirmation
  const onDeleteChat = (): void => {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteChat();
    }
  };

  // State
  let inputText = $state('');
  let isLoading = $state(false);
  let error = $state<string | null | undefined>(null);
  let chatContainer: HTMLElement;
  let showReplacedResponses = $state(false); // show/hide AI responses that were replaced later
  let showMetadata = $state(false); // show/hide AI responses that were replaced later
  let showMetadataToggle = $derived(!!chat.metadata);
  let showSettingsModal = $state(false);
  let editingMessageId = $state<string | null>(null);
  let listRevision = $state(0);
  let lastMessageId = $derived(chatMessages[chatMessages.length - 1]?.id);
  let userMessages = $derived(chatMessages.filter((m: ChatMessage) => m.role === MessageRole.user));
  let lastUserMessageId = $derived(userMessages[userMessages.length - 1]?.id);

  onMount(() => {
    if (!chat) {
      return;
    }

    scrollToBottom();
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }

  const upsertChatMessage = async (messageProps?: Partial<ChatMessage>): Promise<void> => {
    try {
      if (!chat) {
        return;
      }

      if (!messageProps) {
        messageProps = {
          role: MessageRole.user,
          content: inputText,
        };
      } else {
        if (!messageProps.id && editingMessageId) {
          messageProps.id = editingMessageId;
        }

        if (!messageProps.id && !messageProps.role) {
          messageProps.role = MessageRole.user;
        }
      }

      if (!messageProps.content) {
        messageProps.content = inputText;
        if (!messageProps.content) {
          console.log('ChatComponent.upsertChatMessage: No content provided');
          return;
        }
      }

      const editingMessage = messageProps.id
        ? chatMessages.find((m: ChatMessage) => m.id === messageProps?.id)
        : null;

      const role = messageProps.role || editingMessage?.role || MessageRole.user;

      // Clear input field immediately for better UX
      if (role === MessageRole.user) {
        inputText = '';
      }

      // Set loading state to show the typing indicator
      isLoading = true;

      if (messageProps.id && role === MessageRole.user) {
        // The use is editing an existing message. We are deleting all AI generated messages
        // that were in response to this message.
        let foundEditingMessage = false;
        let idx = 0;
        const promises: Promise<void>[] = [];
        for (const message of chatMessages) {
          if (messageProps.id === message.id) {
            foundEditingMessage = true;
          } else if (foundEditingMessage) {
            promises.push(deleteChatMessage(message.id));
          }
          idx++;
        }
        await Promise.all(promises);
      }

      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageProps)
      });

      const responseData: ChangeChatMessageResponse = await response.json();

      if (responseData.error) {
        console.error('ChatComponent.upsertChatMessage: error received', responseData.error);
        error = responseData.error;
        return;
      }

      if (!Array.isArray(responseData.chatMessages) || responseData.chatMessages.length < 1) {
        console.error('ChatComponent.upsertChatMessage: no messages returned', responseData.error);
        error = 'Failed to create message';
        return;
      }

      // console.log('Received messages', responseData.chatMessages);

      for (const msg of responseData.chatMessages) {
        if (msg.id === messageProps.id) {
          editingMessage.content = msg.content;
        } else {
          chatMessages.push(msg);

          // If this is an AI response message, turn off the loading indicator
          if (msg.role === MessageRole.assistant) {
            isLoading = false;
          }
        }
      }

      scrollToBottom();

      // Note: We don't turn off isLoading here because the server will automatically
      // generate an AI response, and we want to keep showing the loading indicator
      // until that response comes back
    } catch (err) {
      console.error('Error creating message:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
      // Turn off loading indicator if there was an error
      isLoading = false;
    }
  }

  const onGenerateChatMessage = async (): Promise<void> => {
    try {
      // console.log('ChatComponent.onGenerateChatMessage called.');

      // Set loading state to show the typing indicator
      isLoading = true;

      const latestMessage = chatMessages[chatMessages.length - 1];
      if (latestMessage.role === MessageRole.assistant) {
        latestMessage.replaced = true;
      }

      const response = await fetch(`/api/chats/${chat.id}/messages/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData: GenerateChatMessageResponse = await response.json();

      if (responseData.error) {
        console.error('ChatComponent.onGenerateChatMessage: error received', responseData.error);
        return;
      }

      chatMessages[chatMessages.length - 1].canRegenerate = false;
      chatMessages.push(responseData.chatMessage);

      // Turn off loading indicator after receiving the response
      isLoading = false;

      // Scroll to the bottom to show the new message
      scrollToBottom();
    } catch (error) {
      console.error('ChatComponent.onGenerateChatMessage: error received',
        error instanceof Error ? error.message : 'An error occurred while saving settings');
      // Turn off loading indicator if there was an error
      isLoading = false;
    }
  };

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    upsertChatMessage(
      editingMessageId
        ? { id: editingMessageId, content: inputText }
        : undefined
    );
    // Clear the editing state
    editingMessageId = null;
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    // Send message on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      upsertChatMessage(
        editingMessageId
          ? { id: editingMessageId, content: inputText }
          : undefined
      );
      // Clear the editing state
      editingMessageId = null;
    }
  }

  const deleteChatMessage = async (chatMessageId: string): Promise<void> => {
    try {
      if (!chat) {
        return;
      }

      const response = await fetch(`/api/chats/${chat.id}/messages/${chatMessageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error ending chat:', data.error);
        return;
      }

      const messageIndex = chatMessages.findIndex((m: ChatMessage) => m.id === chatMessageId);

      if (messageIndex < 0) {
        console.error('Error deleting message:', 'Message not found in array');
        return
      }

      chatMessages.splice(messageIndex, 1);
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  }

  const openLlmSettings = (): void => {
    showSettingsModal = true;
  }

  const closeLlmSettings = (): void => {
    showSettingsModal = false;
  }

  const onEditMessage = (messageId: string, content: string): void => {
    // console.log('onEditMessage called.', messageId, content);
    editingMessageId = messageId;
    inputText = content;

    setTimeout(() => {
      const textarea: HTMLTextAreaElement | null = document.querySelector('.chat-input textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  }
</script>

<div class="chat-container" role="region" aria-label="Chat conversation">
  {#if chat?.title && chat.mode === ChatMode.tuning}
    <div class="chat-title">
      {chat.title}
    </div>
  {/if}
  <div class="chat-messages" bind:this={chatContainer} aria-live="polite">
    {#if chatMessages.length === 0}
      <div class="empty-state" role="status" aria-live="polite">
        <p>No messages yet. Start a chat!</p>
      </div>
    {/if}

    {#key listRevision}
      {#each chatMessages as message (message.id)}
        {#if !((!showReplacedResponses || chat.mode === ChatMode.experiment) && message.replaced)}
          <div
            class="message {message.role} {message.error ? 'error' : ''} {message.sendStatus === 'retrying' ? 'retrying' : ''}"
            role="listitem"
            aria-label="{message.role === MessageRole.user ? 'Your message' : message.role === MessageRole.platform ? 'Platform message' : 'Assistant message'}"
          >
            <MessageBubble
              {chat}
              {message}
              replaced={message.replaced}
              {showMetadata}
              {llms}
              canEdit={message.role === MessageRole.user && message.id === lastUserMessageId}
              canRegenerate={message.role === MessageRole.assistant && message.id === lastMessageId}
              {onGenerateChatMessage}
              {onEditMessage}
              {updateChatMessage}
            />
          </div>
        {/if}
      {/each}
    {/key}

    {#if isLoading}
      <div
        class="message assistant loading"
        role="status"
        aria-label="Assistant is typing"
      >
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">Assistant</span>
          </div>
          <div class="message-text">
            <div class="typing-indicator" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="sr-only">Assistant is generating a response</span>
          </div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-message" role="alert" aria-live="assertive">
        <p>Error: {error}</p>
      </div>
    {/if}
  </div>

  {#if showSettingsModal}
    <ChatConfigModal
      {chat}
      {chatConfig}
      {chatConfigs}
      {llms}
      onClose={closeLlmSettings}
      {updateChat}
      {updateChatConfig}
    />
  {/if}

  {#if !showSettingsModal}
    <form class="chat-input {editingMessageId ? 'editing' : ''}" onsubmit={onSubmit} aria-label="Message input form">
      {#if editingMessageId}
        <div class="editing-indicator" aria-live="polite">
          <span>Editing message</span>
          <button
            type="button"
            class="cancel-edit-button"
            onclick={() => {
              inputText = '';
              editingMessageId = null;
            }}
            aria-label="Cancel editing"
          >
            Cancel
          </button>
        </div>
      {/if}
      <div class="input-container">
        <textarea
          placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
          bind:value={inputText}
          onkeydown={handleKeydown}
          disabled={isLoading}
          rows="2"
          aria-label="Message input"
          aria-multiline="true"
        ></textarea>
        <button
          type="submit"
          class="send-button"
          disabled={isLoading || !inputText.trim()}
          aria-label="{isLoading ? 'Sending message' : editingMessageId ? 'Update message' : 'Send message'}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="send-icon">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      {#if chat.mode === ChatMode.experiment}
        <div class="end-chat-section">
          <div class="info-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Please continue this chat until you feel that the platform has a good understanding
            of your situation and can find the optimal mentor for you.
          </div>
          <div class="button-container">
            <button
              type="button"
              class="end-chat-button"
              onclick={() => onEndChat()}
              title="Provide feedback"
              aria-label="End this chat"
            >
              I am ready for a mentor - end chat
            </button>
          </div>
        </div>
      {/if}
    </form>
    <div class="chat-llm-info">
      <span>
        {chat.llmId || 'Unknown model'} |
        temp: {chat.llmTemperature !== null ? chat.llmTemperature : '???'} |
        token: {chat.inputTokens}/{chat.outputTokens} |
        cost: ${chat.cost}
      </span>
      <span>
        {#if chat.mode === ChatMode.tuning || user}
          <button class="edit-settings-button" onclick={() => openLlmSettings()} title="Edit settings" aria-label="Edit settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button class="delete-settings-button" onclick={() => onDeleteChat()} title="Delete chat" aria-label="Delete chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          {/if}
      </span>
    </div>
    {#if chat.mode === ChatMode.tuning}
      <div class="toggles-wrapper">
        <div class="toggle-container">
          <label class="toggle-switch">
            <input
              type="checkbox"
              checked={showReplacedResponses}
              onclick={() => showReplacedResponses = !showReplacedResponses}
            />
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Show replaced responses</span>
        </div>
        {#if showMetadataToggle}
          <div class="toggle-container">
            <label class="toggle-switch">
              <input
                type="checkbox"
                checked={showMetadata}
                onclick={() => showMetadata = !showMetadata}
              />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Show metadata</span>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .end-chat-section {
    color: #797979;
    margin-top: 1.5rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }

  .info-text {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-icon {
    flex-shrink: 0;
    margin-top: 6px;
  }

  .button-container {
    display: flex;
    align-items: center;
  }

  .end-chat-button {
    padding: 6px 12px;
    font-weight: normal;
    background-color: #797979;
    text-wrap: nowrap !important;
    white-space: nowrap;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 1000px;
    margin: 0 auto;
    overflow: hidden;
    background-color: #fff;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .chat-title {
    padding: 0 1rem;
    color: #797979;
    letter-spacing: .5rem;
    z-index: 10;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }

  .message {
    display: flex;
    margin-bottom: 1rem;
  }

  .message.user {
    justify-content: flex-end;
  }

  /*.message.retrying :global(.message-content) {*/
  /*  opacity: 0.7;*/
  /*}*/

  /* Accessibility - Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .typing-indicator span {
    width: 0.5rem;
    height: 0.5rem;
    background-color: #888;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: 0s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-0.25rem);
    }
  }

  .error-message {
    padding: 0.75rem;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 0.5rem;
    margin: 0.5rem 0;
  }

  .chat-input {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
    background-color: #f9f9f9;
  }

  .chat-input.editing {
    background-color: #e3f2fd;
  }

  .editing-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #2196f3;
    font-weight: 500;
  }

  .cancel-edit-button {
    background: none;
    border: none;
    color: #666;
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    margin: 0;
  }

  .cancel-edit-button:hover {
    color: #f44336;
    text-decoration: underline;
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    position: relative;
    width: 100%;
  }

  textarea {
    flex: 1;
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    resize: none;
    font-family: inherit;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
    min-height: 60px;
    box-sizing: border-box;
  }

  textarea:focus {
    border-color: #2196f3;
  }

  .send-button {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #2196f3;
    color: white;
    transition: background-color 0.2s;
    line-height: 0;
  }

  .send-button:hover:not(:disabled) {
    background-color: #1976d2;
  }

  .send-button:disabled {
    background-color: #bdbdbd;
  }

  .send-icon {
    transform: rotate(45deg) translateX(-2px) translateY(2px);
    margin: 0;
    padding: 0;
    display: block;
  }

  button {
    margin-left: 0.5rem;
    padding: 0 1.25rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background-color: #1976d2;
  }

  button:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }

  .chat-llm-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.7rem;
    color: #666;
    background-color: #f9f9f9;
  }

  .chat-llm-info span {
    display: flex;
    align-items: center;
  }

  .edit-settings-button {
    background: none;
    border: none;
    color: #666;
    padding: 0;
    margin: 0 0.5rem 0 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .edit-settings-button:hover {
    color: #0d47a1;
  }

  .delete-settings-button {
    background: none;
    border: none;
    color: #666;
    padding: 0;
    margin: 0 0 0 0.5rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .delete-settings-button:hover {
    color: #d32f2f;
  }

  .toggles-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    padding: 0 1rem;
    margin: 0.5rem 0;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    margin-right: 1.5rem;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    margin-right: 8px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: #2196F3;
  }

  input:focus + .toggle-slider {
    box-shadow: 0 0 1px #2196F3;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  .toggle-label {
    font-size: 0.9rem;
    color: #555;
  }
</style>
