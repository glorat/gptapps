import {logger} from './logger'
import {QnaStorage} from 'src/lib/ai/largeDocQna'
import {answerMe, createEmbedding} from 'src/lib/ai/openaiFacade'
import {VectorStore} from 'langchain/vectorstores'


export async function performQna2(question:string, db: VectorStore, filter:(d:any)=>boolean = ()=>true, prompt?: string): Promise<string|undefined> {
  const similarities = await db.similaritySearch(question, 10, filter)

  const contexts = []
  let contextLength = 0
  const MAX_CONTEXT_LENGTH = 5000 // Maximum ~3500 tokens. But chars/token ratio is about 4

  for (const similarity of similarities) {
    const input = similarity.pageContent
    if (input.length+contextLength > MAX_CONTEXT_LENGTH) {
      break
    }
    contexts.push(input)
    contextLength += input.length
  }

  logger.info(`best inputs: ${contexts.length} snippets`)
  if (contexts.length>0) {
    const bestInput = contexts.join('\n')
    const answer = await answerMe({context: bestInput, userPrompt: question, initPrompt: prompt})
    return answer
  } else {
    return undefined
  }
}

export async function performQna(question:string, storage: QnaStorage, prompt?: string): Promise<string|undefined> {
  // const loader = loaderFromOpts(opts)
  const data: { keys: string[], embeds: number[][] } = await storage.readEmbeds()
  // JSON.parse(await readFile(embedsFile, 'utf-8'));
  const qryEmbed = await createEmbedding({input:question})
  // Find most similar segment index to all other inputs
  const similarities = findMostSimilarSegments(qryEmbed, data.embeds)

  const contexts = []
  let contextLength = 0
  const MAX_CONTEXT_LENGTH = 5000 // Maximum ~3500 tokens. But chars/token ratio is about 4

  for (const similarity of similarities) {
    const key = data.keys[similarity.index]
    const input = await storage.readContent(key)
    if (input.length+contextLength > MAX_CONTEXT_LENGTH) {
      break
    }
    contexts.push(input)
    contextLength += input.length
  }

  logger.info(`best inputs: ${contexts.length} snippets`)
  if (contexts.length>0) {
    const bestInput = contexts.join('\n')
    const answer = await answerMe({context: bestInput, userPrompt: question, initPrompt: prompt})
    return answer
  } else {
    return undefined
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  // Calculate the dot product of a and b
  const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);

  // Calculate the magnitude of a
  const aMagnitude = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));

  // Calculate the magnitude of b
  const bMagnitude = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));

  // Calculate the cosine similarity between a and b
  const similarity = dotProduct / (aMagnitude * bMagnitude);

  return similarity;
}

function findMostSimilarSegments(queryEmbedding: number[], segmentEmbeddings: number[][]): { index: number; similarity: number; }[] {
  // Calculate the similarity between the query embedding and each segment embedding
  const similarities = segmentEmbeddings.map((segmentEmbedding, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, segmentEmbedding),
  }));

  // Sort the similarities array by similarity in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities;
}
