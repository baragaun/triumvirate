<script lang="ts">
  export let buttonNumber: number;
  export let formData: any;
  export let onChange: () => void;
</script>

<div class="form-group">
  <div class="feedback-button-caption">Button #{buttonNumber + 1}</div>
  <div class="feedback-button-row">
    <div class="feedback-button-col-full">
      <label for="feedbackButtonValue{buttonNumber}">Value</label>
      <input
        type="text"
        id="feedbackButtonValue{buttonNumber}"
        bind:value={formData[`feedbackButtonValue${buttonNumber}`]}
        on:input={() => onChange()}
        placeholder="helpful"
      />
    </div>
    <div class="feedback-button-col-full">
      <label for="feedbackButtonLabel{buttonNumber}">Label</label>
      <input
        type="text"
        id="feedbackButtonLabel{buttonNumber}"
        bind:value={formData[`feedbackButtonLabel${buttonNumber}`]}
        on:input={() => onChange()}
        placeholder="Helpful"
      />
    </div>
    <div class="feedback-button-col-full">
      <label for="feedbackButtonTitle{buttonNumber}">Title</label>
      <input
        type="text"
        id="feedbackButtonTitle{buttonNumber}"
        bind:value={formData[`feedbackButtonTitle${buttonNumber}`]}
        on:input={() => onChange()}
        placeholder="This response was helpful"
      />
    </div>
    <div class="feedback-button-col-full">
      <label for="feedbackButtonLlmText{buttonNumber}">Text for LLM</label>
      <input
        type="text"
        id="feedbackButtonLlmText{buttonNumber}"
        bind:value={formData[`feedbackButtonLlmText${buttonNumber}`]}
        on:input={() => onChange()}
        placeholder="The user found your response helpful"
      />
    </div>
    <div class="feedback-button-col">
      <label for="feedbackButtonIcon{buttonNumber}">Icon</label>
      <select
        id="feedbackButtonIcon{buttonNumber}"
        bind:value={formData[`feedbackButtonIcon${buttonNumber}`]}
        on:change={() => onChange()}
      >
        <option value="">Select an icon</option>
        <option value="thumbs-up">thumbs-up</option>
        <option value="thumbs-down">thumbs-down</option>
        <option value="wrong">wrong</option>
      </select>
    </div>
  </div>
</div>

<style>
  .feedback-button-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .feedback-button-col label {
    display: block;
  }

  .feedback-button-col-full {
    width: 100%;
  }

  .feedback-button-col-full input {
    width: 100%;
  }

  .feedback-button-caption {
    font-weight: 500;
    color: #333;
  }

  .feedback-button-row {
    display: flex;
  }
</style>
