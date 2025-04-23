<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { ChatInfo } from '$lib/types';
  import type { Chat, ChatConfig } from '$lib/server/db/schema';
  import NewChatForm from './NewChatForm.svelte';
  import { ChatMode } from '$lib/enums';

  let { data } = $props<{ data: PageData }>();

  // Get user data
  const user = data.user;
  const guestUserName = data.guestUserName;

  // Get the user's name (either a signed-in user or guest)
  const getUserName = (): string => {
    if (user?.username) {
      return user.username;
    } else if (guestUserName) {
      return guestUserName;
    } else {
      return 'Guest';
    }
  };

  let chats = $state<Chat[]>([]);
  let chatConfigs = $state<ChatConfig[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showNewChatForm = $state(false);
  let isDeletingChat = $state<string | null>(null); // Tracks which chat is being deleted

  onMount(async () => {
    try {
      console.log('/chats mounted', { user });
      await fetchChatConfigs();
      if (user?.id) {
        await fetchChats();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  async function fetchChatConfigs() {
    try {
      const response = await fetch('/api/chat-configs');
      const responseData = await response.json();

      if (!responseData.error && responseData.chatConfigs && responseData.chatConfigs.length > 0) {
        chatConfigs = responseData.chatConfigs;
      }
    } catch (error) {
      console.error('Error fetching chatConfigs:', error);
    }
  }

  async function fetchChats() {
    try {
      const response = await fetch('/api/chats');
      const responseData = await response.json();

      if (!responseData.error && responseData.chats && responseData.chats.length > 0) {
        chats = responseData.chats;
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }

  const toggleNewChatForm = () => {
    showNewChatForm = !showNewChatForm;
  };

  const deleteChat = async (chatId: string, event: Event): Promise<void> => {
    // Prevent the click from navigating to the chat page
    event.preventDefault();
    event.stopPropagation();

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      isDeletingChat = chatId;

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();

      if (responseData.error) {
        error = responseData.error;
        return;
      }

      // Remove the deleted chat from the list
      chats = chats.filter(chat => chat.id !== chatId);

    } catch (err) {
      console.error('Error deleting chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isDeletingChat = null;
    }
  };

  const handleChatFormSubmit = async (title: string, configId: string): Promise<void> => {
    // Clear any previous error
    error = null;

    const selectedChatConfig = chatConfigs.find(config => config.id === configId);

    if (!selectedChatConfig) {
      console.error('Selected chat config not found');
      error = 'Selected chat configuration not found';
      return;
    }

    isLoading = true;
    try {
      const chatProps: Partial<Chat> = {
        username: user?.username || getUserName(),
        title: title || undefined,
        caption: selectedChatConfig.caption || undefined,
        mode: ChatMode.tuning,
        welcomeMessage: selectedChatConfig.welcomeMessage || undefined,
        configId: selectedChatConfig.id || undefined,
        llmId: selectedChatConfig.llmId || undefined,
        llmTemperature: selectedChatConfig.llmTemperature || 0.7,
        llmInstructions: selectedChatConfig.llmInstructions || undefined,
        llmMaxTokens: selectedChatConfig.llmMaxTokens || 1000,
        // Note: The server will use the logged-in user's ID from the session if available
      };

      // Send the request to the API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatProps)
      });

      const data: ChatInfo = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      if (!data.chat) {
        error = data.error || 'Failed to create chat';
        return;
      }

      console.log('Navigating to chat page:', `/chats/${data.chat.id}`);
      // Hide the form
      showNewChatForm = false;
      await goto(`/chats/${data.chat.id}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="chats-container">
  <div class="chats-content">
    {#if isLoading}
      <div class="loading-state">
        <p>Loading your chats...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>Error: {error}</p>
      </div>
    {:else if chats.length === 0}
      <div class="empty-state">
        <p>You don't have any chats yet. Start a new chat to begin!</p>
      </div>
    {:else}
      <div class="chats-list">
        {#each chats as chat (chat.id)}
          <div class="chat-card-container">
            <a href="/chats/{chat.id}" class="chat-card">
              <div class="chat-info">
                <h2 class="chat-title">{chat.title || 'Untitled Chat'}</h2>
                <div class="chat-details">
                  <p class="chat-date">{new Date(chat.createdAt).toLocaleDateString()}</p>
                  {#if chat.configId}
                    <p class="chat-config">Config: {chat.configId}</p>
                  {/if}
                </div>
              </div>
              <div class="chat-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </div>
            </a>
            <button
              class="delete-button"
              onclick={(e) => deleteChat(chat.id, e)}
              disabled={isDeletingChat === chat.id}
              aria-label="Delete chat"
            >
              {#if isDeletingChat === chat.id}
                <div class="spinner"></div>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <div class="new-chat-section">
      {#if !showNewChatForm}
        <button class="new-chat-button" onclick={toggleNewChatForm}>
          New Chat
        </button>
      {:else}
        <NewChatForm
          chatConfigs={chatConfigs}
          onSubmit={handleChatFormSubmit}
          onCancel={toggleNewChatForm}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .chats-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0.5rem 1rem; /* Reduced top padding from 2rem to 0.5rem */
  }

  .chats-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .new-chat-section {
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
  }

  .new-chat-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: auto;
    padding: 0.5rem 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .new-chat-button:hover {
    background-color: #1976d2;
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: #666;
  }

  .error-state {
    color: #c62828;
  }

  .chats-list {
    display: flex;
    flex-direction: column;
  }

  .chat-card-container {
    position: relative;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
  }

  .chat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.2s;
    flex: 1;
  }

  .chat-card:hover {
    background-color: #f5f5f5;
  }

  .delete-button {
    background: none;
    border: none;
    color: #bdbdbd;
    padding: 0.5rem;
    margin-right: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
    width: 36px;
    height: 36px;
  }

  .delete-button:hover {
    background-color: #ffebee;
    color: #e53935;
  }

  .delete-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid #e53935;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .chat-info {
    flex: 1;
  }

  .chat-title {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .chat-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.25rem;
  }

  .chat-date {
    margin: 0;
    font-size: 0.8rem;
    color: #888;
  }

  .chat-config {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
    background-color: #f0f4f8;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
  }

  .chat-arrow {
    color: #bdbdbd;
  }

  .chat-card:hover .chat-arrow {
    color: #2196f3;
  }
</style>
