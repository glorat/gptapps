import {Configuration, OpenAIApi} from 'openai';
// import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// dotenv.config()

type OpenAIEngine = 'text-ada-001' |  'text-davinci-003'

const engineId: OpenAIEngine = 'text-davinci-003'
export const Config = {
  openAiApiKey : process.env.OPENAPI_KEY,
  engineId,
  embedModel: 'text-embedding-ada-002'
}

if (!Config.openAiApiKey) throw new Error('OPENAPI_KEY env not setup. Please check .env file or environment variables')

export const getOpenAIAPI = () => new OpenAIApi(new Configuration({
  apiKey: Config.openAiApiKey,
}));
