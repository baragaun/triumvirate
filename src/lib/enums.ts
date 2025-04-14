export enum MessageRole {
  assistant = 'assistant',
  system = 'system',
  user = 'user',
}

export enum ChatMode {
  /**
   * The chat is used to fine tune the settings.
   */
  edit = 'edit',
  /**
   * The chat is used by a test user to gather experimental test data.
   */
  user = 'user',
}
