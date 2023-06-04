import {CreateEmbeddingRequest} from 'openai';
import {Config, getOpenAIAPI} from './config';
import {logger} from './logger'

export async function createEmbedding(input: string): Promise<number[]> {
  const req: CreateEmbeddingRequest = {
    input,
    model: Config.embedModel,
    // user: TODO

  }
  logger.debug(`createEmbedding for ${input.length} bytes`)
  const res = await getOpenAIAPI().createEmbedding(req)
  logger.info(`createEmbedding return result for ${input.length}`)
  return res.data.data[0].embedding
}
