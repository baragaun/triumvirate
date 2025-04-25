import type { ChatMetadata } from '$lib/types';

type ParsedMessage = {
  content: string;
  metadata?: ChatMetadata | null;
};

export const parseAiMessage = (text: string): ParsedMessage => {
  const metadataRegex = /<metadata>(.*?)<\/metadata>/s;
  const match = text.match(metadataRegex);

  let metadata: ChatMetadata | null = null;
  if (match && match[1]) {
    try {
      metadata = JSON.parse(match[1]);
    } catch (error) {
      console.error('Failed to parse metadata JSON:', error);
    }
  }

  const content = text.replace(metadataRegex, '').trim();

  return { content, metadata };
};

// const testText = "<metadata>{\n  \"chat_quality\": 0.7,\n  \"user_willingness\": 0.8,\n  \"is_bad_actor\": 0.1,\n  \"goal_reached\": 0.3,\n  \"messages_to_goal\": 5,\n  \"info\": [\n    \"The entrepreneur came through a LATAM campaign and their preferred language is probably Spanish.\",\n    \"Micromentor has 212 mentors listed in LATAM.\"\n  ],\n  \"advice\": [\n    {\n      \"value\": \"Consider reaching out to local fishing associations or industry groups to network and find potential mentors with relevant experience.\",\n      \"confidence\": 0.7,\n      \"specificity\": 0.6,\n      \"approved\": false\n    }\n  ],\n  \"notes_from_ai\": \"The entrepreneur seems eager to connect with a mentor and is open to guidance. I will continue to gather relevant information to help match them with the best possible mentor.\",\n  \"data\": {\n    \"country_code\": {\n      \"value\": \"CO\",\n      \"confidence\": 0.9\n    },\n    \"industry\": {\n      \"value\": \"agriculture\",\n      \"confidence\": 0.8\n    }\n  }\n}</metadata>\n\nHello! Thank you for sharing a bit about your fishing supply business in Colombia. That's great that you're looking to connect with a mentor to help grow your venture. \n\nBased on the information you provided, it seems like you're in the early stages of your business. Some advice I can offer is to consider reaching out to local fishing associations or industry groups to network and find potential mentors with relevant experience in your field. They may be able to provide valuable insights and guidance as you continue to develop your business.\n\nThe Micromentor platform has a number of mentors located in Latin America, so I'm confident we can find someone well-suited to support you. Please let me know if you have any other details you'd like to share about your business and the type of mentoring assistance you're seeking. I'm here to help get you connected with the right mentor."
// console.log(parseAiMessage(testText));
