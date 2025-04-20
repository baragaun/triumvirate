<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { form, data } = $props<{ form: ActionData, data: PageData }>();

  // Form state
  let username = $state('');
  let password = $state('');

  // Computed property to check if form is valid
  let isLoginFormValid = $derived(username.trim() !== '' && password.trim() !== '');

  // Handle form submission
  const onSubmit = () => {
    // The form will be submitted to the server-side action
    // This function can be used for any client-side validation or processing
    console.log('Form submitted with username:', username);
    // The actual form submission is handled by the enhance action
  };

  // We'll use the basic enhance function and rely on the console logs in onSubmit

  // Guest login functionality removed
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Login</h1>

    <form method="post" action="?/login" use:enhance onsubmit={onSubmit}>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autocomplete="username"
          bind:value={username}
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="current-password"
          bind:value={password}
        />
      </div>

      {#if data.message}
        <div class="success-message">
          {data.message}
        </div>
      {/if}

      {#if form?.message}
        <div class="error-message">
          {form.message}
        </div>
      {/if}

      <div class="form-actions">
        <button
          type="submit"
          class="primary-button"
          disabled={!isLoginFormValid}
        >
          Login
        </button>
      </div>

      <div class="auth-links">
        <p>Don't have an account? <a href="/register">Register</a></p>
      </div>
    </form>

    <!-- Guest option removed -->
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background-color: #f9f9f9;
  }

  .auth-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
  }

  h1 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .form-actions {
    margin-top: 1.5rem;
  }

  .primary-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .primary-button:hover {
    background-color: #1976d2;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .auth-links {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
  }

  .auth-links a {
    color: #2196f3;
    text-decoration: none;
  }

  .auth-links a:hover {
    text-decoration: underline;
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
