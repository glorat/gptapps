import {OpenAIEmbeddings, OpenAIEmbeddingsParams} from 'langchain/embeddings/openai'
import {AzureOpenAIInput} from 'langchain/dist/types/openai-types'
import OpenAI, {ClientOptions} from 'openai'
import {MemoCache} from './openaiWrapper'

export class OpenAIEmbeddingsWithMemo extends OpenAIEmbeddings {
  cache:MemoCache<number[]>

  constructor(fields?: Partial<OpenAIEmbeddingsParams> &
                Partial<AzureOpenAIInput> & {
                verbose?: boolean;
                openAIApiKey?: string;
              },
              configuration?: ClientOptions,
              cache?: MemoCache<number[]>) {
    super(fields, configuration)
    if (!cache) throw new Error('cache arg is required')
    this.cache = cache

  }

  override embedQuery(text: string): Promise<number[]> {
    const fn = async (text:string) => await super.embedQuery(text)
    return memoizeFunction(fn, this.cache)(text)
  }
}

type KeySerializer = (arg: any) => string;

const defaultKeySerializer: KeySerializer = (args: any[]) => JSON.stringify(args);

function memoizeFunction<T extends NonNullable<unknown>>(
  fn: (...args: any[]) => Promise<T>,
  cache: MemoCache<T>,
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
