<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { PageData } from './$types';
  import EditorContentRenderer from '$lib/components/EditorContentRenderer.svelte'
  import type { ChatCreationRequestData } from '$lib/types'

  // Props
  let { data } = $props<{ data: PageData }>();

  // State
  let username = $state(data.user?.username || '');
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let introduction = data.chatConfig?.introduction || 'Thank you for helping us optimize the new mentoring assistant experience!';

  // Computed property to check if form is valid
  let isFormValid = $derived(username.trim() !== '');

  const startAssistant = async (): Promise<void> => {
    // Clear any previous error
    error = null;

    if (!isFormValid) {
      error = 'Please enter your name to continue.';
      return;
    }

    isLoading = true;
    const requestData: ChatCreationRequestData = {
      props: {
        userId: data.user?.id,
        configId: data.chatConfig.id,
        username: username.trim(),
      },
      user: {
        ...data.user,
        username: username.trim(),
        trackId: page.url.searchParams.get('t'),
      }
    };

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (responseData.error) {
        error = responseData.error;
        return;
      }

      if (!responseData.chat) {
        error = responseData.error || 'Failed to create chat';
        return;
      }

      // Navigate to the chat with the username as a parameter
      await goto(`/chats/${responseData.chat.id}?username=${encodeURIComponent(username)}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="page">
  <main>
    <div class="content">
      <div class="content-inner">
        {#if isLoading}
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading assistant...</p>
          </div>
        {:else}
          <div>
            <div class="introduction">
              <EditorContentRenderer contentData={introduction} />
            </div>

            <div class="form-group">
              <label for="username">What is your name?</label>
              <input
                type="text"
                id="username"
                bind:value={username}
                placeholder="Enter your name"
                required
                oninput={() => error = null}
              />
            </div>

            {#if error}
              <div class="error-message">
                <p>{error}</p>
              </div>
            {/if}

            <button
              class="start-button"
              onclick={startAssistant}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Starting...' : "Let's Start!"}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  .page {
    min-height: 100vh;
    width: 100%;
    display: flex;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh; /* Ensure main takes full viewport height */
  }

  .content {
    width: 80%;
    max-width: 800px;
    height: 100%; /* Take full height of parent */
    padding: 0 3rem 3rem 3rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow-y: auto; /* Enable vertical scrolling */
    display: flex;
    flex-direction: column; /* Stack children vertically */
  }

  /* Add this new style to create a wrapper for the scrollable content */
  .content-inner {
    padding: 2rem 0;
    flex: 1;
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    .content {
      padding: .5rem .5rem 3rem;
      width: 95%;
    }
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

  .introduction {
    text-align: left;
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 2rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 500;
    color: #333;
    font-size: 1.1rem;
  }

  input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1.1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus {
    border-color: #2196f3;
    outline: none;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
  }

  .start-button {
    width: 100%;
    padding: 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .start-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s;
    z-index: -1;
  }

  .start-button:hover:not(:disabled) {
    background-color: #1976d2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }

  .start-button:hover::before {
    left: 100%;
  }

  .start-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
  }

  .start-button:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #ffebee;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #f44336;
    text-align: left;
  }

  .error-message p {
    color: #d32f2f;
    margin: 0;
    font-size: 0.95rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

</style>
