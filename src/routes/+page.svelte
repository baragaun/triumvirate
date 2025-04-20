<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  // Get data from props
  let { data } = $props<{ data: PageData }>();

  // State
  let userName = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Computed property to check if form is valid
  let isFormValid = $derived(userName.trim() !== '');

  const startAssistant = async (): Promise<void> => {
    // Clear any previous error
    error = null;

    if (!isFormValid) {
      error = 'Please enter your name to continue.';
      return;
    }

    isLoading = true;
    try {
      // Create a simple chat with just the username
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: userName.trim()
        })
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      if (!data.chat) {
        error = data.error || 'Failed to create chat';
        return;
      }

      // Navigate to the chat with the username as a parameter
      await goto(`/chats/${data.chat.id}?userName=${encodeURIComponent(userName)}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="container">
  <header>
    <h1>AI Assistant</h1>
    <p>Get started with our AI assistant to help with your mentoring journey</p>
  </header>

  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading assistant...</p>
      </div>
    {:else}
      <div class="welcome-container">
        <div class="welcome-content">

          <div class="form-group">
            <label for="userName">What should we call you?</label>
            <input
              type="text"
              id="userName"
              bind:value={userName}
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
            {isLoading ? 'Starting...' : 'Start Assistant'}
          </button>

          <div class="login-prompt">
            <p>Already have an account? <a href="/login">Log in</a> or <a href="/register">Register</a></p>
          </div>
        </div>
      </div>
    {/if}
  </main>

  <footer>
    <p>© 2023 Triumvirate</p>
  </footer>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
    padding-top: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #2196f3;
  }

  /* h2 styles removed */

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  footer {
    text-align: center;
    margin-top: 2rem;
    padding: 1rem 0;
    color: #666;
    font-size: 0.875rem;
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

  .welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
  }

  .welcome-content {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 3rem;
    max-width: 600px;
    width: 100%;
    text-align: center;
  }

  .welcome-content p {
    color: #555;
    margin-bottom: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
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
    transition: all 0.2s;
    margin-bottom: 1.5rem;
  }

  .start-button:hover:not(:disabled) {
    background-color: #1976d2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
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

  .login-prompt {
    margin-top: 1rem;
    font-size: 0.95rem;
    color: #666;
  }

  .login-prompt a {
    color: #2196f3;
    text-decoration: none;
    font-weight: 500;
  }

  .login-prompt a:hover {
    text-decoration: underline;
  }
</style>
