import {Configuration, OpenAIApi} from 'openai';

type OpenAIEngine = 'text-ada-001' |  'text-davinci-003'

const engineId: OpenAIEngine = 'text-davinci-003'
export const Config = {
  openAiApiKey : process.env.OPENAPI_KEY,
  engineId,
  embedModel: 'text-embedding-ada-002'
}

export const getOpenAIAPI = () => {
  if (!Config.openAiApiKey) throw new Error('OPENAPI_KEY env not setup. Please check .env file or environment variables')

  return new OpenAIApi(new Configuration({
    apiKey: Config.openAiApiKey,
  }));
}
