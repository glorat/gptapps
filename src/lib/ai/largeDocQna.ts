import {chunkDocument} from './chunkDocument'
import {range} from 'lodash'
import {encode} from 'gpt-tokenizer'
import {createEmbedding} from 'src/lib/ai/openaiFacade'
import {getLangchainConfig} from 'src/lib/ai/config'
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {MemoryVectorStore} from 'langchain/vectorstores/memory';
import {OpenAIEmbeddingsWithMemo} from 'src/lib/ai/EmbeddingsWithCache'
import {embedsCache} from 'src/lib/ai/openaiWrapper'

export interface EmbedsData { lengths: number[]; keys: string[]; tokens: number[]; embeds: number[][] }

export interface QnaStorage {
  listContent: () => Promise<string[]>
  readContent: (key:string) => Promise<string>
  readEmbeds: () => Promise<EmbedsData>
  writeEmbeds: (embeds: any) => Promise<void>
}

export async function createVectorStoreFromLargeContent(content: string, progress?: (p:number)=>void){
  const docChunks = await chunkDocument(content)
  OpenAIEmbeddings.length

  const embeddings = new OpenAIEmbeddingsWithMemo(getLangchainConfig(), undefined, embedsCache)

  const vectorStore = new MemoryVectorStore(embeddings)
  const embeds = []
  for (let idx = 0; idx < docChunks.length; idx++) {
    const chunk = docChunks[idx].pageContent;
    if (progress) progress(idx / docChunks.length)
    const result = await embeddings.embedQuery(chunk);
    embeds.push(result);
  }
  await vectorStore.addVectors(embeds, docChunks)
  //MemoryVectorStore.fromDocuments(docChunks, embeddings)
  return vectorStore
}

export async function createQnaStorageFromLargeContent(content: string, progress?: (p:number)=>void): Promise<QnaStorage> {
  const chunks =(await chunkDocument(content)).map(d => d.pageContent)
  const embeds: any[] = [];

  // Ensure we request the embedding sequentially
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    if (progress) progress(idx / chunks.length)
    const result = await createEmbedding({input:chunk});
    embeds.push(result);
  }
  if (progress) progress(0)

  const keys = range(chunks.length).map(x => x.toString()) as string[]
  const tokens:number[] = chunks.map(chunk => encode(chunk).length)
  const lengths:number[] = chunks.map(chunk => chunk.length)


  const instance: QnaStorage = {
    listContent: async () => {
      return keys
    },
    readContent: async (key: string) => {
      const idx = parseInt(key)
      return chunks[idx]
    },
    readEmbeds: async () => {
      return {embeds, keys, tokens, lengths} as EmbedsData
    },
    writeEmbeds: async () => {
      throw new Error('Cannot write embeds in-memory')
    },
  }

  return instance

}
