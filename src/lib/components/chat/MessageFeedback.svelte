<script lang="ts">
  import type { Chat, ChatMessage } from '$lib/server/db/schema'
  import FeedbackButton from '$lib/components/chat/FeedbackButton.svelte'

  const {
    chat,
    message,
    updateChatMessage
  } = $props<{
    chat: Chat;
    message: ChatMessage;
    updateChatMessage: (changes: Partial<ChatMessage>) => void;
  }>();

  const feedbackButtons = [
    { value: chat.feedbackButtonValue0, label: chat.feedbackButtonLabel0, title: chat.feedbackButtonTitle0, icon: chat.feedbackButtonIcon0 },
    { value: chat.feedbackButtonValue1, label: chat.feedbackButtonLabel1, title: chat.feedbackButtonTitle1, icon: chat.feedbackButtonIcon1 },
    { value: chat.feedbackButtonValue2, label: chat.feedbackButtonLabel2, title: chat.feedbackButtonTitle2, icon: chat.feedbackButtonIcon2 },
    { value: chat.feedbackButtonValue3, label: chat.feedbackButtonLabel3, title: chat.feedbackButtonTitle3, icon: chat.feedbackButtonIcon3 },
    { value: chat.feedbackButtonValue4, label: chat.feedbackButtonLabel4, title: chat.feedbackButtonTitle4, icon: chat.feedbackButtonIcon4 },
  ].filter(b => b.value)

  // State
  let feedback = $state<string | null>(message.feedback || null);
  let isFeedbackSubmitted = $state(!!message.feedback);

  const onSaveFeedback = async (selectedFeedback: string) => {
    if (!selectedFeedback) {
      console.log('MessageFeedback.onSaveFeedback: No feedback provided.');
      return;
    }

    feedback = selectedFeedback;

    const changes: Partial<ChatMessage> = {
      id: message.id,
      feedback,
    };
    await updateChatMessage(changes);
    isFeedbackSubmitted = true;
  };
</script>

<div class="message-feedback">
  {#if isFeedbackSubmitted}
    <div class="feedback-submitted">
      <span>Thanks! Feedback: <span class="feedback-value">{feedback}</span></span>
    </div>
  {:else}
    <div class="feedback-buttons">
      {#each feedbackButtons as feedbackButton}
        <FeedbackButton
          value={feedbackButton.value}
          label={feedbackButton.label}
          title={feedbackButton.title}
          icon={feedbackButton.icon}
          onClick={onSaveFeedback}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Feedback UI styles */
  .message-feedback {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0;
    margin-bottom: 0;
    font-size: 0.85rem;
    display: flex;
    justify-content: flex-end;
  }

  .feedback-buttons {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    margin-bottom: 0;
  }

  .feedback-submitted {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #666;
    font-size: 0.75rem;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .feedback-value {
    font-weight: 500;
    color: #68859b;
    text-transform: capitalize;
  }
</style>
