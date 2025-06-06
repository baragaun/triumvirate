<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form } = $props<{ form: ActionData }>();
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Register</h1>

    <form method="post" action="?/register" use:enhance>
      <div class="form-group">
        <label for="name">Your name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autocomplete="name"
        />
      </div>

      <div class="form-group">
        <label for="name">Email</label>
        <input
          id="email"
          name="email"
          type="text"
          required
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="new-password"
        />
        <small>Minimum 6 characters</small>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autocomplete="new-password"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Secret</label>
        <input
          id="secret"
          name="secret"
          type="text"
          required
        />
      </div>

      {#if form?.message}
        <div class="error-message">
          {form.message}
        </div>
      {/if}

      <div class="form-actions">
        <button type="submit" class="primary-button">Register</button>
      </div>

      <div class="auth-links">
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </form>
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

  small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
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
</style>
