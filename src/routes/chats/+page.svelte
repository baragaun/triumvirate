<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { ChatInfo } from '$lib/types';
  import type { Chat, ChatConfig } from '$lib/server/db/schema'

  let { data } = $props<{ data: PageData }>();

  // Get user data
  const user = data.user;
  const guestUserName = data.guestUserName;

  // Get the user's name (either logged in user or guest)
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
  let selectedChatConfig = $state<ChatConfig | null>(null);
  let selectedChatConfigId = $state<string>('default');
  let isLoading = $state(true);
  let showConfigSection = $state(false);
  let error = $state<string | null>(null);

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
        selectedChatConfigId = responseData.selectedChatConfigId;
        if (responseData.selectedChatConfigId) {
          selectedChatConfig = chatConfigs.find(config => config.id === responseData.selectedChatConfigId) || null;
        }
        showConfigSection = chatConfigs.length > 1;
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
      console.error('Error fetching chatConfigs:', error);
    }
  }

  const createChat = async (): Promise<void> => {
    // Clear any previous error
    error = null;
    if (!selectedChatConfig) {
      selectedChatConfig = chatConfigs.find(config => config.id === 'default') ||
        chatConfigs[0] || null;
      console.error('No chat config selected');
      error = 'No chat config selected';
      return;
    }

    isLoading = true;
    try {
      const chatProps: Partial<Chat> = {
        userName: user?.username || getUserName(),
        caption: selectedChatConfig.caption || undefined,
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
      await goto(`/chats/${data.chat.id}`);
    } catch (err) {
      console.error('Error sending message:', err);
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
          <a href="/chats/{chat.id}" class="chat-card">
            <div class="chat-info">
              <h2 class="chat-title">{chat.title || 'Untitled Chat'}</h2>
              <p class="chat-date">{new Date(chat.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="chat-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <div class="new-chat-section">
      <button class="new-chat-button" onclick={createChat}>
        New
      </button>
    </div>
  </div>
</div>

<style>
  .chats-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  /* Header styles removed - not used in this component */

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

  .chat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.2s;
  }

  .chat-card:hover {
    background-color: #f5f5f5;
  }

  .chat-info {
    flex: 1;
  }

  .chat-title {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .chat-date {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #888;
  }

  .chat-arrow {
    color: #bdbdbd;
  }

  .chat-card:hover .chat-arrow {
    color: #2196f3;
  }
</style>
