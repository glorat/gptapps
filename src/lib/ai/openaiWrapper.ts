/**
 * All functions in this file are only to be used by openaiFacade and cloud functions
 * Function must take only a single argument
 * Function must be idempotent
 */
import {CreateEmbeddingRequest} from 'openai'
import {Config, getOpenAIAPI} from 'src/lib/ai/config'
import {logger} from 'src/lib/ai/logger'
import {callWithRetry} from 'src/lib/ai/callWithRetry'
import {LRUCache} from 'lru-cache'
import SHA256 from 'crypto-js/sha256';

export const embedsCache = new LRUCache<string, number[]>({max: 100})

type KeySerializer = (arg: any) => string;

const defaultKeySerializer: KeySerializer = (args: any[]) => JSON.stringify(args);

function memoizeFunction<T extends NonNullable<unknown>>(
  fn: (...args: any[]) => Promise<T>,
  cache: LRUCache<string, T>,
  keySerializer: KeySerializer = defaultKeySerializer
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    const cacheKey = keySerializer(args);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const result = await fn(...args);
    cache.set(cacheKey, result);

    return result;
  };
}
export const createEmbeddingDirect = memoizeFunction(createEmbeddingDirectNoMemo, embedsCache);

async function createEmbeddingDirectNoMemo(args: {input:string}): Promise<number[]> {

  const {input} = args
  const hash = SHA256(input).toString()
  const cached =  embedsCache.get(hash)
  if (cached) {
    return cached
  }

  const req: CreateEmbeddingRequest = {
    input,
    model: Config.embedModel,
    // user: TODO

  }
  logger.debug(`createEmbedding for ${input.length} bytes`)
  const res = await getOpenAIAPI().createEmbedding(req)
  logger.info(`createEmbedding return result for ${input.length}`)
  const final = res.data.data[0].embedding
  embedsCache.set(hash, final)
  return final
}



const completionConfig = {
  temperature: 0,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
}

export async function answerMeDirect(arg: {context: string, userPrompt: string, initPrompt?:string}): Promise<string> {
  const defaultPrompt = "Answer the question as truthfully as possible using the provided text, and if the answer is not contained within the text below, say \"I don't know\"\n\n"
  const initPrompt = arg.initPrompt ?? defaultPrompt
  const {context, userPrompt} = arg
  const prompt = initPrompt
    + 'Context:\n' + context + '\n\n'
    + 'Q: ' + userPrompt + '\nA: ';

  logger.debug(prompt)

  const response = await callWithRetry(() => getOpenAIAPI().createChatCompletion({
    ...completionConfig,
    model: 'gpt-3.5-turbo',
    messages:[
      {role: 'system', content: context},
      {role: 'user', content: initPrompt},
      {role: 'user', content: userPrompt}
    ],
    // user: TODO: for tracking purposes
  }));

  // const response = await openai.createCompletion({
  //     ...completionConfig,
  //     // stop: ["Human:", "AI:", "Olea Bot:"],
  //     model: Config.engineId,
  //     prompt,
  //
  //     // user: TODO: for tracking purposes
  //
  //
  // });

  let res: string = response.data!.choices![0].message!.content ?? '';
  res = ((/^\s*$/g).test(res) ? 'Failed' : res);
  // Could potentially also detect "I don't know" and return undefined in that case
  return res
}
