import OpenAIAPI, {type ClientOptions} from 'openai'
import {OpenAIChat} from 'langchain/llms/openai'
// import FormData from 'form-data'

type OpenAIEngine = 'text-ada-001' | 'text-davinci-003'

const engineId: OpenAIEngine = 'text-davinci-003'
export const Config = {
  engineId,
  embedModel: 'text-embedding-ada-002',
  chatModel: 'gpt-3.5-turbo' //
}

//modelName: 'gpt-3.5-turbo-1106',

//
// class CustomFormData extends FormData {
//   getHeaders(): Record<string, string> {
//     return {}
//   }
// }

/** As set by the browser user */
let aiUserSettings: Partial<AiUserSettings>

export function resetAiUserSettings() {
  aiUserSettings = {
    server: 'openai',
    openaiSettings: {apiKey: process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY || ''},
    unstructuredSettings: {endpoint: process.env.UNSTRUCTURED_URL ?? ''},
  }
  return aiUserSettings
}
resetAiUserSettings()

export interface AiUserSettings {
  server: 'openai' | 'azure' | 'hosted'
  azureSettings: { apiKey: string, basePath: string }, // only applicable if server is 'azure
  openaiSettings: { apiKey: string }, // only applicable if server is 'openai'
  unstructuredSettings: { apiKey?: string, endpoint: string },
}

export function applyAiUserSettings(settings: AiUserSettings) {
  aiUserSettings = {...settings}
}


export function getOpenAIParams(settings = aiUserSettings) {
  const OpenAIParams: ClientOptions = {
    apiKey: process.env.OPENAPI_KEY ?? process.env.OPENAI_API_KEY ?? '',
    dangerouslyAllowBrowser: true, // we have our mitigations
    // formDataCtor: CustomFormData
  }
  if (settings.server === 'openai') {
    OpenAIParams.apiKey = settings.openaiSettings?.apiKey
    OpenAIParams.baseURL = undefined
    return OpenAIParams
  } else if (settings.server === 'azure') {
    OpenAIParams.apiKey = settings.azureSettings?.apiKey
    OpenAIParams.baseURL = settings.azureSettings?.basePath
    return OpenAIParams
  } else {
    throw 'not yet available feature'
  }
}

export function getLangchainEmbedConfig() {
  if (aiUserSettings.server === 'openai') {
    return {
      openAIApiKey: aiUserSettings.openaiSettings?.apiKey,
    }
  } else {
    return getLangchainConfig()
  }
}

export function getLangchainConfig() {
  if (aiUserSettings.server === 'openai') {
    return {
      openAIApiKey: aiUserSettings.openaiSettings?.apiKey,
      modelName: Config.chatModel,
      temperature: 0
    }
  } else if (aiUserSettings.server === 'azure') {
    return {
      azureOpenAIApiKey: aiUserSettings.azureSettings?.apiKey,
      azureOpenAIApiInstanceName: 'kevin-test-openai-1', // FIXME: configurable
      azureOpenAIApiVersion: '2023-03-15-preview',
      azureOpenAIApiDeploymentName: Config.chatModel.replaceAll(/\./g, ''),
      azureOpenAIApiEmbeddingsDeploymentName: Config.embedModel.replaceAll(/\./g, ''),
    }
  } else {
    throw new Error('unsupported')
  }
}

export function getOpenAIConfig(deployment?: string): ClientOptions {
  if (!getOpenAIParams().apiKey) throw new Error('OPENAI_API_KEY env not setup. Please check .env.dev file or environment variables')
  const params = {...getOpenAIParams()}
  if (params.baseURL) {
    if (deployment) {
      const d2 = deployment.replaceAll(/\./g, '')
      params.baseURL = `${params.baseURL}/openai/deployments/${d2}`
      params.defaultHeaders = {'api-key': params.apiKey}
      params.defaultQuery = {'api-version': '2023-03-15-preview'}
    }
    else {
      throw new Error(`Custom endpoint ${params.baseURL} needs a deployment name`)
    }
  }
  return params
}

export const getOpenAIAPI = (deployment?: string) => {
  const config = getOpenAIConfig(deployment)
  return new OpenAIAPI.OpenAI(config)
}

export function getSettingsFromLocalStorage() {
  const savedSettings = localStorage.getItem('aiUserSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    applyAiUserSettings(settings)
    return settings
  }

}


export function getChatGPTClientOptions(clientOptions?: any) {
  const cfg = getOpenAIConfig(Config.chatModel)
  if (cfg.baseURL) {
    // Set up azure mode
    // https://kevin-test-openai-1.openai.azure.com//openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview
    const opts = {azure: true, reverseProxyUrl: `${cfg.baseURL}/chat/completions?api-version=2023-03-15-preview`}
    return {...(clientOptions ?? {}), ...opts}
  } else {
    return clientOptions ?? {}
  }

}

export function getUnstructuredEndpoint() {
  let endpoint = aiUserSettings?.unstructuredSettings?.endpoint
  if (!endpoint) {
    console.log(`getting endpoint from process.env.UNSTRUCTURED_URL`)
    endpoint = process.env.UNSTRUCTURED_URL
  }
  // if (!endpoint) {
  //   endpoint = defaultUnstructuredUrl
  // }
  return `${endpoint ?? ''}/general/v0/general`
}

export function getOpenAIChat() {
  return new OpenAIChat(getLangchainConfig())
}
