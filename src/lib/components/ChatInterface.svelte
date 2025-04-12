<script lang="ts">
  import { onMount } from 'svelte';
  import type { Chat, ChatMessage, LlmContext } from '$lib/server/db/schema'
  import type {
    CreateChatMessageResponse,
    EndChatRequest,
  } from '$lib/types'
  import { MessageRole } from '$lib/enums';
  import { goto } from '$app/navigation'

  // Props
  let {
    chat,
    llmContext,
    initialMessages = [],
  } = $props<{
    chat: Chat;
    llmContext?: LlmContext;
    initialMessages?: ChatMessage[];
  }>();

  // State
  let chatMessages = $state<ChatMessage[]>(initialMessages || []);
  let inputText = $state('');
  let isLoading = $state(false);
  let error = $state<string | null | undefined>(null);
  let chatContainer: HTMLElement;
  let showFeedback = $state(false);
  let feedbackText = $state('');
  let feedbackRating = $state<number | null>(null);
  let retryingMessageId = $state<string | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }

  const createChatMessage = async (role: MessageRole, content?: string): Promise<void> =>{
    const messageContent = content || inputText;

    // Clear input field immediately for better UX
    if (role === MessageRole.user && !content) {
      inputText = '';
    }

    const messageProps: Partial<ChatMessage> = {
      role,
      content: messageContent,
      // chatId is provided in the URL, no need to include it here
    };

    // Create a temporary message ID for optimistic updates
    const tempId = `temp-${Date.now()}`;

    // Add optimistic message to UI immediately (for user messages only)
    if (role === MessageRole.user) {
      const optimisticMessage: ChatMessage = {
        id: tempId,
        chatId: chat.id,
        role,
        content: messageContent,
        status: null,
        error: null,
        feedback: null,
        sendToLlm: true,
        sendToUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      chatMessages.push(optimisticMessage);
      scrollToBottom();
    }

    try {
      console.log('createChatMessage: Sending', messageProps);
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageProps)
      });

      const data: CreateChatMessageResponse = await response.json();

      if (data.error || !Array.isArray(data.messages) || data.messages.length < 1) {
        console.error('Error creating message:', data.error);
        error = data.error || 'Failed to create message';
        return;
      }

      console.log('Received messages', data.messages);

      // Replace the optimistic message with the real one
      const optimisticIndex = chatMessages.findIndex(m => m.id === tempId);
      if (optimisticIndex >= 0) {
        chatMessages[optimisticIndex] = data.messages[0];
        for (let i = 1; i < data.messages.length; i++) {
          chatMessages.push(data.messages[i]);
        }
      } else {
        // If we couldn't find the optimistic message, just add the real one
        for (const msg of chatMessages) {
          chatMessages.push(msg);
        }
      }

      scrollToBottom();
    } catch (err) {
      // Handle error - mark the optimistic message as failed
      const optimisticIndex = chatMessages.findIndex(m => m.id === tempId);
      if (optimisticIndex >= 0) {
        chatMessages[optimisticIndex] = {
          ...chatMessages[optimisticIndex],
          content: chatMessages[optimisticIndex].content + ' (Failed to send)',
          error: err instanceof Error ? err.message : 'Failed to send message'
        };
      }

      console.error('Error creating message:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
    }
  }

  // Handle form submission
  function handleSubmit(event: Event): void {
    event.preventDefault();
    createChatMessage(MessageRole.user);
  }

  // Handle keydown events
  function handleKeydown(event: KeyboardEvent): void {
    // Send message on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      createChatMessage(MessageRole.user);
    }
  }

  // Format timestamp
  function formatTime(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Retry sending a failed message
  const retryMessage = async (messageId: string): Promise<void> => {
    // Find the failed message
    const messageIndex = chatMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const failedMessage = chatMessages[messageIndex];

    // Mark as retrying
    chatMessages[messageIndex].status = 'retrying';
    chatMessages[messageIndex].error = null;

    retryingMessageId = messageId;

    try {
      // Create a new message with the same content
      await createChatMessage(failedMessage.role as MessageRole, failedMessage.content);

      // Remove the failed message
      chatMessages = chatMessages.filter(m => m.id !== messageId);
    } catch (err) {
      // If retry fails, keep the message marked as failed
      chatMessages[messageIndex].status = 'retrying';
      chatMessages[messageIndex].error = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error retrying message:', err);
    } finally {
      retryingMessageId = null;
    }
  }

  const endChat = async (feedback?: string, rating?: number): Promise<void> => {
    try {
      const requestData: EndChatRequest = {
        feedback,
        rating
      }

      console.log(`Ending chat ${chat.id} with feedback:`, feedback);

      const response = await fetch(`/api/chats/${chat.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error ending chat:', data.error);
      }

      await goto('/');
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  }

  onMount(() => {
    console.log('ChatInterface mounted, chat:', chat.id);
    console.log(`Using ${chatMessages.length} initial messages`);

    // Scroll to bottom
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  });
</script>

<div class="chat-container" role="region" aria-label="Chat conversation">
  <div class="chat-messages" bind:this={chatContainer} aria-live="polite">
    {#if chatMessages.length === 0}
      <div class="empty-state" role="status" aria-live="polite">
        <p>No messages yet. Start a chat!</p>
      </div>
    {/if}

    {#each chatMessages as message (message.id)}
      <div
        class="message {message.role} {message.error ? 'error' : ''} {message.status === 'retrying' ? 'retrying' : ''}"
        role="listitem"
        aria-label="{message.role === 'user' ? 'Your message' : 'AI Assistant message'}"
      >
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
            <span class="message-time" aria-label="Sent at {formatTime(message.createdAt)}">{formatTime(message.createdAt)}</span>
          </div>
          <div class="message-text">
            {message.content}
            {#if message.error}
              <div class="message-error" role="alert" aria-live="assertive">
                <span class="error-text">{message.error}</span>
                <button
                  class="retry-button"
                  onclick={() => retryMessage(message.id)}
                  disabled={retryingMessageId === message.id}
                  aria-label="{message.status === 'retrying' ? 'Retrying message' : 'Retry sending message'}"
                >
                  {message.status === 'retrying' ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div
        class="message assistant loading"
        role="status"
        aria-label="AI Assistant is typing"
      >
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">AI Assistant</span>
          </div>
          <div class="message-text">
            <div class="typing-indicator" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="sr-only">AI Assistant is typing a response</span>
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

  {#if showFeedback}
    <div class="feedback-container" role="dialog" aria-labelledby="feedback-title">
      <h3 id="feedback-title">Provide Feedback</h3>
      <div class="rating-container" role="radiogroup" aria-label="Rating from 1 to 5 stars">
        {#each [1, 2, 3, 4, 5] as rating (rating)}
          <button
            class="rating-button {feedbackRating === rating ? 'selected' : ''}"
            onclick={() => feedbackRating = rating}
            role="radio"
            aria-checked={feedbackRating === rating}
            aria-label="{rating} star{rating !== 1 ? 's' : ''}"
          >
            {rating}
          </button>
        {/each}
      </div>
      <textarea
        placeholder="Your feedback helps us improve..."
        bind:value={feedbackText}
        rows="3"
        aria-label="Feedback comments"
      ></textarea>
      <div class="feedback-actions">
        <button
          class="cancel-button"
          onclick={() => showFeedback = false}
          aria-label="Cancel feedback"
        >
          Cancel
        </button>
        <button
          class="submit-button"
          disabled={!feedbackRating}
          onclick={() => {
            endChat(feedbackText, feedbackRating || 0);
            showFeedback = false;
          }}
          aria-label="Submit feedback"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  {:else}
    <form class="chat-input" onsubmit={handleSubmit} aria-label="Message input form">
      <textarea
        placeholder="Type your message..."
        bind:value={inputText}
        onkeydown={handleKeydown}
        disabled={isLoading}
        rows="1"
        aria-label="Message input"
        aria-multiline="true"
      ></textarea>
      <div class="button-container">
        <button
          type="button"
          class="feedback-button"
          onclick={() => showFeedback = true}
          title="Provide feedback"
          aria-label="Open feedback form"
        >
          I&apos;m done
        </button>
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          aria-label="{isLoading ? 'Sending message' : 'Send message'}"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
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

  .message-content {
    max-width: 80%;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    overflow-wrap: break-word;
  }

  .user .message-content {
    background-color: #e9f5ff;
    border-bottom-right-radius: 0.25rem;
  }

  .assistant .message-content {
    background-color: #f0f0f0;
    border-bottom-left-radius: 0.25rem;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
  }

  .message-role {
    font-weight: bold;
  }

  .message-time {
    color: #666;
  }

  .message-text {
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .message.error .message-content {
    border-left: 3px solid #f44336;
  }

  .message-error {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(244, 67, 54, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .error-text {
    color: #f44336;
    font-size: 0.85rem;
    font-style: italic;
  }

  .retry-button {
    background-color: #f44336;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-button:hover:not(:disabled) {
    background-color: #d32f2f;
  }

  .retry-button:disabled {
    background-color: #e57373;
    cursor: not-allowed;
  }

  .message.retrying .message-content {
    opacity: 0.7;
  }

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
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
    background-color: #f9f9f9;
  }

  textarea {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    resize: none;
    font-family: inherit;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  textarea:focus {
    border-color: #2196f3;
  }

  .button-container {
    display: flex;
    align-items: center;
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

  .feedback-button {
    color: #666;
    background-color: #f9f9f9;
    font-size: .7rem;
    padding: 0 0.5rem;
  }

  .feedback-button:hover {
    color: #2196f3;
    background-color: transparent;
  }

  .feedback-container {
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
    background-color: #f9f9f9;
  }

  .feedback-container h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: #333;
  }

  .rating-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .rating-button {
    width: 2.5rem;
    height: 2.5rem;
    margin: 0 0.25rem;
    border-radius: 50%;
    background-color: #f0f0f0;
    color: #333;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rating-button.selected {
    background-color: #2196f3;
    color: white;
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .cancel-button {
    background-color: #f0f0f0;
    color: #333;
  }

  .submit-button {
    background-color: #4caf50;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #388e3c;
  }
</style>
