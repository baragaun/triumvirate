export enum MessageRole {
  assistant = 'assistant',
  platform = 'platform',
  user = 'user',
}

export enum ChatMode {
  /**
   * The chat is used to fine tune the settings.
   */

  tuning = 'tuning',
  /**
   * The chat is used by a test user to gather experimental test data.
   */
  experiment = 'experiment',
}

export enum ChatMessageFeedback {
  /**
   * The message was helpful
   */
  helpful = 'helpful',

  /**
   * The message was not helpful
   */
  unhelpful = 'unhelpful',

  /**
   * The message contains wrong content.
   */
  wrong = 'wrong',
}
