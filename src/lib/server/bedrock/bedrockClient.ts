import {
  BedrockRuntimeClient,
  type BedrockRuntimeClientConfig,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockClient,
  type BedrockClientConfig,
} from '@aws-sdk/client-bedrock';
import { env } from '$env/dynamic/private';
import { fromIni } from '@aws-sdk/credential-providers'

let _client: BedrockClient;
let _runtimeClient: BedrockRuntimeClient;

const getClient = () => {
  if (!_client) {
    const bedrockConfig: BedrockClientConfig = {
      region: env.AWS_REGION,
      credentials: fromIni({ profile: env.AWS_PROFILE_NAME }),
    };
    console.log('Creating BedrockClient with config:', bedrockConfig);
    _client = new BedrockClient(bedrockConfig);
  }
  return _client;
}

const getRuntimeClient = () => {
  if (!_runtimeClient) {
    const bedrockConfig: BedrockRuntimeClientConfig = {
      region: env.AWS_REGION,
      credentials: fromIni({ profile: env.AWS_PROFILE_NAME }),
    };
    console.log('Creating BedrockClient with config:', bedrockConfig);
    _runtimeClient = new BedrockRuntimeClient(bedrockConfig);
  }
  return _runtimeClient;
}

const bedrockClient = {
  getClient,
  getRuntimeClient,
}

export default bedrockClient
