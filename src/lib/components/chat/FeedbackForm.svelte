<script lang="ts">
  import type { Chat, ChatConfig } from '$lib/server/db/schema';

  let {
    chat,
    chatConfig,
    updateChat,
    onCloseFeedback,
  } = $props<{
    chat: Chat;
    chatConfig: ChatConfig | null;
    updateChat: (changes: Partial<Chat>, endChat: boolean) => void;
    onCloseFeedback: () => void;
  }>();

  // State
  let feedbackText = $state('');
  let rating = $state<number | null>(null);
  let feedbackAnswers = $state<(number | null)[]>(Array(10).fill(null));

  const getQuestions = (): string[] => {
    if (!chatConfig) return [];

    const questions: string[] = [];
    for (let i = 0; i < 10; i++) {
      const question = chatConfig[`feedbackQuestion${i}`];
      if (question) {
        questions.push(question)
      }
    }
    return questions;
  };

  const questions = getQuestions();

  const setAnswer = (index: number, value: number): void => {
    feedbackAnswers[index] = value;
    feedbackAnswers = [...feedbackAnswers]; // Trigger reactivity
  };

  // Check if all visible questions have answers
  const hasAllRequiredAnswers = $derived(
    questions.length === 0 ||
    questions.every((q, i) => feedbackAnswers[i] !== null)
  );

  const onSubmit = () => {
    const changes: Partial<Chat> = {
      id: chat.id,
      rating,
      feedback: feedbackText,
    };

    for (let i = 0; i < 10; i++) {
      if (feedbackAnswers[i] !== null) {
        // @ts-ignore
        changes[`feedbackAnswer${i}` as keyof Chat] = feedbackAnswers[i]?.toString();
      }
    }

    updateChat(changes, true);
  };
</script>

<div class="feedback-overlay">
  <div class="feedback-container" role="dialog" aria-labelledby="feedback-title">
    <div class="feedback-content">
      <div class="feedback-header">
        <h2 id="feedback-title"><span class="heart-icon">❤️</span> Thank you!</h2>
        <div class="feedback-help">
          We truly appreciate your time testing our new assistant. Your feedback helps us
          improve the experience for new entrepreneurs, like you.
        </div>
      </div>
      <div class="feedback-questions-legend">
        1 = Bad, 5 = Great
      </div>
      <div class="scroll-container">
        {#if questions.length > 0}
          <div class="feedback-questions">
            <div class="questions-grid">
              <div class="question-row">
                <div class="question-text">{chat.ratingQuestion || 'How was your overall experience?'}</div>
                <div class="question-rating-wrapper" role="radiogroup"
                     aria-label="Rating from 1 to 5">
                  {#each [1, 2, 3, 4, 5] as value}
                    <button
                      class="rating-button {rating === value ? 'selected' : ''}"
                      onclick={() => rating = value}
                      role="radio"
                      aria-checked={rating === value}
                      aria-label="Rating {value}"
                    >
                      {value}
                    </button>
                  {/each}
                </div>
              </div>
              {#each questions as question, index}
                {#if question}
                  <div class="question-row">
                    <div class="question-text">{question}</div>
                    <div class="question-rating-wrapper" role="radiogroup"
                         aria-label="Rating from 1 to 5">
                      {#each [1, 2, 3, 4, 5] as value}
                        <button
                          class="rating-button {feedbackAnswers[index] === value ? 'selected' : ''}"
                          onclick={() => setAnswer(index, value)}
                          role="radio"
                          aria-checked={feedbackAnswers[index] === value}
                          aria-label="Rating {value}"
                        >
                          {value}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <div class="feedback-form">
          <label for="feedback-text">Additional comments:</label>
          <textarea
            id="feedback-text"
            placeholder="Please share any additional thoughts about your chat experience..."
            bind:value={feedbackText}
            rows="4"
            aria-label="Feedback comments"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="feedback-actions">
      <button
        class="cancel-button"
        onclick={() => { onCloseFeedback(); /*showFeedback = false*/}}
        aria-label="Cancel feedback"
      >
        Cancel
      </button>
      <button
        class="submit-button"
        disabled={!rating || !hasAllRequiredAnswers}
        onclick={onSubmit}
        aria-label="Submit feedback"
      >
        Submit Feedback
      </button>
    </div>
  </div>
</div>

<style>
  .feedback-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .feedback-container {
    width: 90%;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    height: 80%;
    max-width: 1200px;
  }

  .feedback-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem 2rem 1rem;
    min-height: 0; /* Important for flex children to shrink */
  }

  .feedback-header {
    padding-bottom: 1rem;
  }

  .scroll-container {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
  }

  h2 {
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .heart-icon {
    color: #e91e63;
    font-size: 1.6rem;
    display: inline-block;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .feedback-help {
    color: #666;
  }

  .rating-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #f0f0f0;
    color: #757575;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    /* Ensure buttons are perfectly circular */
    aspect-ratio: 1 / 1;
    padding: 0;
  }

  .rating-button:hover {
    background-color: #e0e0e0;
    transform: scale(1.05);
  }

  .rating-button.selected {
    background-color: #2196f3;
    color: white;
  }

  .feedback-form {
    margin-bottom: 1.5rem;
    width: 100%;
  }

  .feedback-questions {
    margin: 1.5rem 0;
    width: 100%;
  }

  .feedback-questions-legend {
    display: flex;
    justify-content: flex-end;
    font-size: .8rem;
    color: #9d9d9d;
    margin-bottom: 0.5rem;
  }

  .questions-grid {
    width: 100%;
    overflow: hidden;
  }

  .question-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 1rem;
    margin-bottom: 1rem;
  }

  .question-text {
    padding-right: 1rem;
  }

  .question-rating-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    resize: vertical;
    font-family: inherit;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
    min-height: 120px;
    box-sizing: border-box;
  }

  textarea:focus {
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 2rem;
    border-top: 1px solid #eee;
    background-color: #f9f9f9;
    border-radius: 0 0 8px 8px;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
  }

  .cancel-button {
    background-color: #f0f0f0;
    color: #333;
  }

  .cancel-button:hover {
    background-color: #e0e0e0;
  }

  .submit-button {
    background-color: #4caf50;
    color: white;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #388e3c;
  }

  .submit-button:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
</style>
