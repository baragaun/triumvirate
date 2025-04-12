import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

const REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

const client = new BedrockRuntimeClient({
  region: REGION,
  credentials: fromIni({ profile: "ai-app-user" })
});

async function testModelAccess() {
  const input = {
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: "Hello!"
        }
      ]
    })
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    const responseBody = await response.body.transformToString();
    console.log("✅ Model access succeeded. Response:");
    console.log(responseBody);
  } catch (error) {
    console.error("❌ Model access failed:");
    console.error(error.name, error.message);
    if (error.$metadata) {
      console.error("Status code:", error.$metadata.httpStatusCode);
    }
  }
}

testModelAccess();
