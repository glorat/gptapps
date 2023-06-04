import {getOpenAIAPI} from './config'
import {createEmbedding} from './createEmbedding';
import {callWithRetry} from './callWithRetry'
import {logger} from './logger'
import {QnaStorage} from 'src/lib/ai/largeDocQna'

const completionConfig = {
  temperature: 0,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
}

const defaultPrompt = "Answer the question as truthfully as possible using the provided text, and if the answer is not contained within the text below, say \"I don't know\"\n\n"

async function answerMe(context: string, userPrompt: string, initPrompt:string = defaultPrompt) {
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

export async function performQna(question:string, storage: QnaStorage, prompt?: string): Promise<string|undefined> {
  // const loader = loaderFromOpts(opts)
  const data: { keys: string[], embeds: number[][] } = await storage.readEmbeds()
  // JSON.parse(await readFile(embedsFile, 'utf-8'));
  const qryEmbed = await createEmbedding(question)
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
    const answer = await answerMe(bestInput, question, prompt)
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
