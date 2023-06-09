import {Configuration, ConfigurationParameters, OpenAIApi} from 'openai'

import FormData from 'form-data'
import ChatGPTClient from 'src/lib/ai/ChatGPTClient'

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


let aiUserSettings: Partial<AiUserSettings> = {
  server: 'openai',
  openaiSettings: {apiKey: process.env.OPENAPI_KEY??''},
  unstructuredSettings: {endpoint: process.env.UNSTRUCTURED_URL ?? ''},
}
export interface AiUserSettings {
  server: 'openai' | 'azure' | 'hosted'
  azureSettings: {apiKey:string, basePath:string}, // only applicable if server is 'azure
  openaiSettings: {apiKey: string}, // only applicable if server is 'openai'
  unstructuredSettings: {apiKey?: string, endpoint: string},
}

export function applyAiUserSettings(settings:AiUserSettings) {
  aiUserSettings = {...settings}
}

function getOpenAIParams(settings = aiUserSettings) {
  const OpenAIParams: ConfigurationParameters = {
    apiKey: process.env.OPENAPI_KEY ?? '',
    formDataCtor: CustomFormData
  }
  if (settings.server === 'openai') {
    OpenAIParams.apiKey = settings.openaiSettings?.apiKey
    OpenAIParams.basePath = undefined
    return OpenAIParams
  } else if (settings.server === 'azure') {
    OpenAIParams.apiKey = settings.azureSettings?.apiKey
    OpenAIParams.basePath = settings.azureSettings?.basePath
    return OpenAIParams
  } else {
    throw 'not yet available feature'
  }
}

export function getLangchainConfig() {
  if (aiUserSettings.server === 'openai') {
    return {openAIApiKey: aiUserSettings.openaiSettings?.apiKey}
  } else if (aiUserSettings.server === 'azure') {
    return {
      azureOpenAIApiKey: aiUserSettings.azureSettings?.apiKey,
      azureOpenAIApiInstanceName: 'kevin-test-openai-1', // FIXME: configurable
      azureOpenAIApiDeploymentName: Config.embedModel,
      azureOpenAIApiVersion: '2023-03-15-preview'
    }
  } else {
    throw new Error('unsupported')
  }
}

export function getOpenAIConfig(deployment?: string) {
  if (!getOpenAIParams().apiKey) throw new Error('OPENAPI_KEY env not setup. Please check .env file or environment variables')
  const params = {...getOpenAIParams()}
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
  return new Configuration(params)
}

export const getOpenAIAPI = (deployment?: string) => {
  const config = getOpenAIConfig(deployment)
  return new OpenAIApi(config);
}

export function getSettingsFromLocalStorage() {
  const savedSettings = localStorage.getItem('aiUserSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    applyAiUserSettings(settings)
    return settings
  }

}



function getChatGPTClientOptions(clientOptions?:any) {
  const cfg = getOpenAIConfig(Config.chatModel)
  if (cfg.basePath) {
    // Set up azure mode
    // https://kevin-test-openai-1.openai.azure.com//openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview
    const opts = {azure: true, reverseProxyUrl: `${cfg.basePath}/chat/completions?api-version=2023-03-15-preview`}
    return {...(clientOptions??{}), ...opts}
  } else {
    return clientOptions ?? {}
  }

}

export function getChatGPTClient(cache:any) {
  const clientOptions = getChatGPTClientOptions()
  const client = new ChatGPTClient(getOpenAIParams().apiKey, clientOptions, cache)
  return client
}

export function getUnstructuredEndpoint() {
  const endpoint = aiUserSettings?.unstructuredSettings?.endpoint ?? ''
  return `${endpoint}/general/v0/general`
}
