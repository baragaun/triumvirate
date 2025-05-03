import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';

interface ExtendedEndChatRequest {
  feedback?: string;
  rating?: number;
  [key: string]: string | number | undefined;
}

export async function POST({ request, params }: RequestEvent) {
  try {
    // Get the chat ID from the URL parameters
    const chatId = params.id;

    // Parse the request body
    const body: ExtendedEndChatRequest = await request.json();

    // Prepare update data
    const updateData: any = {
      id: chatId,
      feedback: body.feedback,
      rating: body.rating,
      endedAt: new Date()
    };

    // Add feedback answers if they exist
    for (let i = 0; i < 10; i++) {
      const answerKey = `feedbackAnswer${i}`;
      if (body[answerKey]) {
        updateData[answerKey] = body[answerKey];
      }
    }

    // Update the chat with feedback, rating, and answers
    await operations.chat.update(updateData);

    return json({});
  } catch (error) {
    console.error('Error processing chat request:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
