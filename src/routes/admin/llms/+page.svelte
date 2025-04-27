<script lang="ts">
  import { onMount } from 'svelte';
  import type { Llm } from '$lib/server/db/schema';

  // State
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let editingLlm = $state<Llm | null>(null);
  let showEditForm = $state(false);

  // Form state
  let formData = $state<Partial<Llm>>({
    tokenCost: 0,
    isAvailable: false
  });

  onMount(async () => {
    try {
      await fetchLlms();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  async function fetchLlms() {
    try {
      const response = await fetch('/api/llms?all=y');
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      llms = data.llms || [];
    } catch (err) {
      console.error('Error fetching LLMs:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch LLM models';
    }
  }

  function hideForm() {
    showEditForm = false;
    editingLlm = null;
  }

  function editLlm(llm: Llm) {
    editingLlm = llm;
    formData = {
      tokenCost: llm.tokenCost || 0,
      isAvailable: llm.isAvailable || false
    };
    showEditForm = true;
  }

  async function handleSubmit() {
    try {
      if (!editingLlm) {
        error = 'No LLM selected for editing';
        return;
      }

      // Create a copy of the form data to send
      const dataToSend = { ...formData };
      console.log('Sending form data:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch(`/api/llms/${editingLlm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchLlms();

      // Hide the form
      hideForm();

      // Show success message
      error = null;
    } catch (err) {
      console.error('Error updating LLM:', err);
      error = err instanceof Error ? err.message : 'Failed to update LLM model';
    }
  }

  async function toggleAvailability(llm: Llm) {
    try {
      const response = await fetch(`/api/llms/${llm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isAvailable: !llm.isAvailable
        })
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchLlms();

    } catch (err) {
      console.error('Error toggling availability:', err);
      error = err instanceof Error ? err.message : 'Failed to update LLM model';
    }
  }

  function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
</script>

<div class="admin-container">

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button onclick={() => error = null}>Dismiss</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading LLM models...</p>
    </div>
  {:else if showEditForm}
    <div class="form-container">
      <h2>Edit LLM Model</h2>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-group">
          <label for="model-id">Model ID</label>
          <input
            type="text"
            id="model-id"
            value={editingLlm?.id || ''}
            disabled
          />
          <small>The unique identifier for this model</small>
        </div>

        <div class="form-group">
          <label for="model-name">Model Name</label>
          <input
            type="text"
            id="model-name"
            value={editingLlm?.name || ''}
            disabled
          />
        </div>

        <div class="form-group">
          <label for="token-cost">Token Cost</label>
          <input
            type="number"
            id="token-cost"
            bind:value={formData.tokenCost}
            step="0.000001"
            min="0"
          />
          <small>Cost per token for this model (in USD)</small>
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" bind:checked={formData.isAvailable} />
            Available for use
          </label>
          <small>If checked, this model will be available for selection in chat configurations</small>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-button" onclick={hideForm}>Cancel</button>
          <button type="submit" class="submit-button">Update Model</button>
        </div>
      </form>
    </div>
  {:else if llms.length === 0}
    <div class="empty-state">
      <p>No LLM models found.</p>
    </div>
  {:else}
    <div class="llms-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Token Cost</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each llms as llm}
            <tr>
              <td>{llm.name}</td>
              <td>{llm.provider}</td>
              <td>${llm.tokenCost?.toFixed(6) || '0.000000'}</td>
              <td>{llm.isAvailable ? '✓' : ''}</td>
              <td class="actions">
                <button
                  class="edit-button"
                  onclick={() => editLlm(llm)}
                  title="Edit model"
                >
                  Edit
                </button>
                <button
                  class={llm.isAvailable ? 'availability-button active' : 'availability-button'}
                  onclick={() => toggleAvailability(llm)}
                  title={llm.isAvailable ? 'Make unavailable' : 'Make available'}
                >
                  {llm.isAvailable ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .admin-container {
    width: 100%;
    padding: 0;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message button {
    background: none;
    border: none;
    color: #c62828;
    cursor: pointer;
    font-weight: 500;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .llms-list {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    background-color: white;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .availability-button {
    background-color: #9e9e9e;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .availability-button.active {
    background-color: #4caf50;
  }

  .edit-button:hover {
    background-color: #1976d2;
  }

  .availability-button:hover {
    background-color: #757575;
  }

  .availability-button.active:hover {
    background-color: #388e3c;
  }

  .form-container {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    max-height: calc(100vh - 12rem);
    overflow-y: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-container h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  .form-group.checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
  }

  .form-group input[type="text"],
  .form-group input[type="number"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  .form-group input[disabled] {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .form-group input[type="checkbox"] {
    margin: 0;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    position: sticky;
    bottom: 0;
    background-color: white;
    padding: 1rem 0;
    border-top: 1px solid #e0e0e0;
    z-index: 10;
  }

  .cancel-button {
    background-color: #e0e0e0;
    color: #333;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .submit-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .cancel-button:hover {
    background-color: #bdbdbd;
  }

  .submit-button:hover {
    background-color: #1976d2;
  }
</style>
