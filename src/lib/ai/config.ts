import {Configuration, ConfigurationParameters, OpenAIApi} from 'openai';

import FormData from 'form-data'

type OpenAIEngine = 'text-ada-001' |  'text-davinci-003'

const engineId: OpenAIEngine = 'text-davinci-003'
export const Config = {
  engineId,
  embedModel: 'text-embedding-ada-002',
  chatModel: 'gpt-3.5-turbo'
}

class CustomFormData extends FormData {
  getHeaders(): Record<string, string> {
    return {};
  }
}

export const OpenAIParams: ConfigurationParameters = {
  apiKey: process.env.OPENAPI_KEY ?? '',
  formDataCtor: CustomFormData
}

export interface AiUserSettings {
  server: 'openai' | 'azure' | 'hosted'
  azureSettings: {apiKey:string, basePath:string}, // only applicable if server is 'azure
  openaiSettings: {apiKey: string}, // only applicable if server is 'openai'
}

export function applyAiUserSettings(settings:AiUserSettings) {
  if (settings.server === 'openai') {
    OpenAIParams.apiKey = settings.openaiSettings.apiKey
    OpenAIParams.basePath = undefined
  } else if (settings.server === 'azure') {
    OpenAIParams.apiKey = settings.azureSettings.apiKey
    OpenAIParams.basePath = settings.azureSettings.basePath
  } else {
    throw 'not yet available feature'
  }
}

export const getOpenAIAPI = (deployment?: string) => {
  if (!OpenAIParams.apiKey) throw new Error('OPENAPI_KEY env not setup. Please check .env file or environment variables')
  const params = {...OpenAIParams}
  if (params.basePath) {
    if (deployment) {
      const d2 = deployment.replaceAll(/\./g,'')
      params.basePath = `${params.basePath}/openai/deployments/${d2}`
      params.baseOptions = {
        headers: {'api-key': params.apiKey},
        params: {
          // Custom endpoints need this api-version
          'api-version': '2023-03-15-preview' // Need a better way to keep this up to date
        }
      }
    } else {
      throw new Error(`Custom endpoint ${params.basePath} needs a deployment name`)
    }
  }
  return new OpenAIApi(new Configuration(params));
}
