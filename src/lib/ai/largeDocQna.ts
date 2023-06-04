import {chunkDocument} from './chunkDocument'
import {createEmbedding} from './createEmbedding'
import {range} from 'lodash'
import {encode} from 'gpt-tokenizer'
import {performQna} from 'src/lib/ai/answer'

export interface EmbedsData { lengths: number[]; keys: string[]; tokens: number[]; embeds: number[][] }

export interface QnaStorage {
  listContent: () => Promise<string[]>
  readContent: (key:string) => Promise<string>
  readEmbeds: () => Promise<EmbedsData>
  writeEmbeds: (embeds: any) => Promise<void>
}


export async function createQnaStorageFromLargeContent(content: string): Promise<QnaStorage> {
  const chunks = chunkDocument(content)
  const embeds: any[] = [];

  // Ensure we request the embedding sequentially
  for (const chunk of chunks) {
    const result = await createEmbedding(chunk);
    embeds.push(result);
  }

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
    writeEmbeds: async (embeds: any) => {
      throw new Error('Cannot write embeds in-memory')
    },
  }

  return instance

}
