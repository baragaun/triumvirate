<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  // Get data from props
  let { data } = $props<{ data: PageData }>();

  // State
  let username = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);

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
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
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
      await goto(`/chats/${data.chat.id}?username=${encodeURIComponent(username)}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="landing-page">
<div class="container">
  <header>
    <h1>Welcome to Micromentor&apos;s Assistant Test</h1>
    <p class="subtitle">Thank you for helping us optimize the new mentoring assistant experience!</p>
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
            {isLoading ? 'Starting...' : 'Let\'s Start!'}
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>
</div>

<style>
  .landing-page {
    min-height: 100vh;
    width: 100%;
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
    padding-top: 2rem;
    animation: fadeIn 1s ease-in-out;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    font-weight: 700;
  }

  .subtitle {
    color: white;
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* h2 styles removed */

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
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
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    padding: 3rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    animation: slideUp 0.8s ease-out;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
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

  @media (max-width: 768px) {
    .welcome-content {
      padding: 2rem;
      margin: 0 1rem;
    }

    h1 {
      font-size: 2.5rem;
    }
  }
</style>
