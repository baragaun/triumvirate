<script lang="ts">
  import { onMount } from 'svelte';
  import type { Llm } from '$lib/server/db/schema';
  import '$lib/styles/actionButtons.css';
  import { enhance } from '$app/forms';

  // State
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let infoMessage = $state<string | null>(null);
  let editingLlm = $state<Llm | null>(null);
  let showEditForm = $state(false);

  // Form state
  let formData = $state<Partial<Llm>>({
    tokenCost: 0,
    inputTokenCost: 0,
    outputTokenCost: 0,
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
      inputTokenCost: llm.inputTokenCost || 0,
      outputTokenCost: llm.outputTokenCost || 0,
      isAvailable: llm.isAvailable || false
    };
    showEditForm = true;
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    try {
      if (!editingLlm) {
        error = 'No LLM selected for editing';
        return;
      }

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

      await fetchLlms();
      hideForm();
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
  {#if infoMessage}
    <div class="info-message">
      <p>{infoMessage}</p>
      <button onclick={() => infoMessage = null}>Dismiss</button>
    </div>
  {/if}
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

      <form onsubmit={onSubmit}>
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
          <label for="input-token-cost">Input Token Cost</label>
          <input
            type="number"
            id="input-token-cost"
            bind:value={formData.inputTokenCost}
            step="0.000001"
            min="0"
          />
          <small>Cost per input token for this model (in USD)</small>
        </div>

        <div class="form-group">
          <label for="output-token-cost">Output Token Cost</label>
          <input
            type="number"
            id="output-token-cost"
            bind:value={formData.outputTokenCost}
            step="0.000001"
            min="0"
          />
          <small>Cost per output token for this model (in USD)</small>
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
          <small>Cost per token (input or output) for this model (in USD).</small>
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
    <div class="scrollable-table">
      <table class="llms-table">
        <thead>
        <tr>
          <th>Name</th>
          <th>Provider</th>
          <th>Input Token Cost</th>
          <th>Output Token Cost</th>
          <th>Token Cost</th>
          <th>Available</th>
          <th class="import-button-th">
            <form method="POST" action="?/importModels" use:enhance={() => {
              infoMessage = 'The models will be re-imported from AWS';
              setTimeout(() => {
                infoMessage = null;
              }, 3000);
            }}
            >
              <button type="submit" class="import-button">
                Import
              </button>
            </form>
          </th>
        </tr>
        </thead>
        <tbody>
        {#each llms as llm}
          <tr>
            <td>{llm.name}</td>
            <td>{llm.provider}</td>
            <td>${llm.inputTokenCost?.toFixed(6) || '0.000000'}</td>
            <td>${llm.outputTokenCost?.toFixed(6) || '0.000000'}</td>
            <td>${llm.tokenCost?.toFixed(6) || '0.000000'}</td>
            <td>{llm.isAvailable ? '✓' : ''}</td>
            <td class="action-buttons">
              <button
                class="action-button edit-button"
                onclick={() => editLlm(llm)}
                title="Edit model"
                aria-label="Edit model"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                class={`action-button ${llm.isAvailable ? 'view-button' : 'edit-button'}`}
                onclick={() => toggleAvailability(llm)}
                title={llm.isAvailable ? 'Make unavailable' : 'Make available'}
                aria-label={llm.isAvailable ? 'Make unavailable' : 'Make available'}
              >
                {#if llm.isAvailable}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                {/if}
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

  .info-message {
    background-color: #a8d49a;
    color: #3b5134;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-message button {
    color: #3b5134;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.8rem;
    background: none;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
    color: #c62828;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.8rem;
    background: none;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

  /* Simplified scrollable table */
  .scrollable-table {
    width: 100%;
    max-height: 93vh;
    overflow: auto;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  .llms-table {
    width: 100%;
    min-width: 800px;
    border-collapse: collapse;
    background-color: white;
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .import-button-th {
    text-align: right;
  }

  .import-button {
    background-color: #afccf4;
    color: #333;
    border: none;
    padding: 0.2rem .5rem;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    font-size: .8rem;
  }

  /* Form styles */
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

  /* Simple media query */
  @media (max-width: 768px) {
    .llms-table {
      min-width: 650px;
    }
  }
</style>
