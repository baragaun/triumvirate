<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { ChatUiData } from '$lib/types';
  import type { Chat, ChatConfig, ChatMessage } from '$lib/server/db/schema';
  import ChatComponent from '$lib/components/chat/ChatComponent.svelte';
  import FeedbackForm from '$lib/components/chat/FeedbackForm.svelte';
  import { encryptString } from '$lib/helpers/encryptString';

  let { data }: { data: ChatUiData } = $props<{ data: ChatUiData }>();
  const chatConfigs = data.chatConfigs || [];
  const llms = data.llms || [];

  // State
  let chat = $state(data.chat);
  let chatConfig = $state(data.chat?.configId && chatConfigs
    ? chatConfigs.find(config => config.id === data.chat?.configId) || null
    : null);
  let chatMessages = $state(data.chatMessages || []);
  let isLoading = $state(true);
  let showFeedback = $state(false);

  onMount(async () => {
    if (!data.chat) {
      await goto('/');
      return;
    }

    // Set isLoading to false after a short delay to ensure the page has rendered
    setTimeout(() => {
      isLoading = false;
    }, 100);
  });

  const updateChat = async (changes: Partial<Chat>, endChat = false): Promise<string> => {
    try {
      console.log('updateChat: changes:', changes);
      if (!changes.id) {
        changes.id = chat.id;
      }

      if (changes.llmInstructions) {
        // The app is sending this encrypted, to prevent security alarms.
        changes.llmInstructions = await encryptString(changes.llmInstructions);
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

      if (endChat) {
        showFeedback = false;
        await goto('/');
      }

      return 'ok';
    } catch (error) {
      console.error('Error updating Chat:', error instanceof Error ? error.message : 'Unknown error');
      return error instanceof Error ? error.message : 'An error occurred while saving settings';
    }
  };

  const updateChatMessage = async (changes: Partial<ChatMessage>): Promise<string> => {
    try {
      console.log('updateChatMessage: changes:', changes);
      if (!changes.id) {
        changes.id = chat.id;
      }

      if (changes.llmInstructions) {
        // The app is sending this encrypted, to prevent security alarms.
        changes.llmInstructions = await encryptString(changes.llmInstructions);
      }

      const response = await fetch(`/api/chats/${chat.id}/messages/${changes.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });

      const responseData = await response.json();

      if (responseData.error) {
        return responseData.error;
      }

      const messageIndex = chatMessages.findIndex((m: ChatMessage) => m.id === changes.id);
      if (messageIndex > -1) {
        chatMessages[messageIndex] = responseData.chatMessage;
      }

      console.log('updateChatMessage: chat message:', $state.snapshot(responseData.chatMessage));

      return 'ok';
    } catch (error) {
      console.error('Error updating ChatMessage:', error instanceof Error ? error.message : 'Unknown error');
      return error instanceof Error ? error.message : 'An error occurred while saving settings';
    }
  };

  const updateChatConfig = async (changes: Partial<ChatConfig>): Promise<string> => {
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
      console.error('Error updating ChatConfig:', error instanceof Error ? error.message : 'Unknown error');
      return error instanceof Error ? error.message : 'An error occurred while saving settings';
    }
  };

  const deleteChat = async (): Promise<void> => {
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
  };

  const onCloseFeedback = (): void => {
    showFeedback = false;
  };

  const onEndChat = (): void => {
    showFeedback = true;
  };
</script>

<div class="container">
  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    {:else if showFeedback}
      <div class="feedback-page">
        <FeedbackForm
          {chat}
          {chatConfig}
          {updateChat}
          {onCloseFeedback}
        />
      </div>
    {:else}
      <div class="chat-container">
        <ChatComponent
          {chat}
          bind:chatMessages
          {chatConfig}
          {chatConfigs}
          {llms}
          {deleteChat}
          {updateChatConfig}
          {updateChatMessage}
          {updateChat}
          {onEndChat}
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

  .chat-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1000px;
    margin: 1rem auto 0;
    height: 100%;
    overflow: auto;
  }

  .feedback-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: #f5f8fa;
    background-image: linear-gradient(135deg, #f5f8fa 0%, #e9f2f9 100%);
  }
</style>
