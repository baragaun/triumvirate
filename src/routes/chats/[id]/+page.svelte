<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'
  import ChatComponent from './components/ChatComponent.svelte'
  import type { ChatUiData } from '$lib/types'
  import type { Chat, ChatConfig } from '$lib/server/db/schema'

  let { data }: { data: ChatUiData } = $props<{ data: ChatUiData }>();
  const chatConfigs = data.chatConfigs || [];
  const user = data.user;
  const guestUserName = data.guestUserName;
  const llms = data.llms || [];

  // State
  let chat = $state(data.chat);
  let chatConfig = $state(data.chat?.configId && chatConfigs
    ? chatConfigs.find(config => config.id === data.chat?.configId) || null
    : null);
  let chatMessages = $state(data.chatMessages || []);
  let isLoading = $state(true);

  onMount(async () => {
    // console.log('Chat page mounted, chat ID:', page.params.id);

    if (!data.chat) {
      await goto('/');
      return;
    }

    // console.log('Chat data:', data.chat);
    // console.log(`Loaded ${data.chatMessages?.length || 0} messages`);

    // Set isLoading to false after a short delay to ensure the page has rendered
    setTimeout(() => {
      isLoading = false;
    }, 100);
  });

  async function updateChat(changes: Partial<Chat>): Promise<string> {
    try {
      console.log('updateChat: changes:', changes);
      if (!changes.id) {
        changes.id = chat.id;
      }

      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });

      const responseData = await response.json();

      if (responseData.error) {
        return responseData.error;
      }
      chat = responseData.chat;

      console.log('updateChat: chat:', $state.snapshot(chat));

      return 'ok';
    } catch (error) {
      error = error instanceof Error ? error.message : 'An error occurred while saving settings';
      return error instanceof Error ? error.message : 'Unknown error';
    }
  }

  async function updateChatConfig(changes: Partial<ChatConfig>): Promise<string> {
    try {
      console.log('updateChatConfig: changes:', changes);
      if (!changes.id) {
        changes.id = chatConfig.id;
      }

      const response = await fetch(`/api/chat-configs/${changes.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });

      const responseData = await response.json();

      if (responseData.error) {
        return responseData.error;
      }
      chatConfig = responseData.chatConfig;

      console.log('updateChatConfig: chatConfig:', $state.snapshot(chatConfig));

      return 'ok';
    } catch (error) {
      error = error instanceof Error ? error.message : 'An error occurred while saving settings';
      return error instanceof Error ? error.message : 'Unknown error';
    }
  }

  async function deleteChat(): Promise<void> {
    try {
      console.log('deleteChat called.');

      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();

      if (responseData.error) {
        return responseData.error;
      }

      await goto('/');
    } catch (error) {
      console.error('Error deleting chat:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
</script>

<div class="container">
  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    {:else}
      <div class="chat-container">
        <ChatComponent
          {user}
          {chat}
          bind:chatMessages
          {chatConfig}
          {chatConfigs}
          {llms}
          {guestUserName}
          {updateChat}
          {updateChatConfig}
          {deleteChat}
        />
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    max-width: 1000px;
    margin: 0 auto;
    overflow: hidden;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Chat container styles */
  .chat-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    margin-top: 1rem;
    height: 100%;
    overflow: auto;
  }


</style>
