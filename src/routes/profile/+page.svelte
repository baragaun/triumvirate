<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
</script>

<div class="profile-container">
  <div class="profile-card">
    <h1>Your Profile</h1>

    <div class="profile-info">
      <div class="info-group">
        <div class="info-label">Name</div>
        <p>{data.user.username}</p>
      </div>

      <div class="info-group">
        <div class="info-label">User ID</div>
        <p class="user-id">{data.user.id}</p>
      </div>
    </div>

    <div class="profile-actions">
      <form method="POST" action="/logout">
        <button type="submit" class="logout-button">Logout</button>
      </form>
    </div>
  </div>
</div>

<style>
  .profile-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background-color: #f9f9f9;
  }

  .profile-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 100%;
    max-width: 500px;
  }

  h1 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
  }

  .profile-info {
    margin-bottom: 2rem;
  }

  .info-group {
    margin-bottom: 1.5rem;
  }

  .info-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }

  p {
    margin: 0;
    padding: 0.75rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-size: 1rem;
  }

  .user-id {
    font-family: monospace;
    word-break: break-all;
  }

  .profile-actions {
    display: flex;
    justify-content: center;
  }

  .logout-button {
    padding: 0.75rem 1.5rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .logout-button:hover {
    background-color: #d32f2f;
  }
</style>
