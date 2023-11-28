import {getOpenAIChat} from './config'
import {logger} from './logger'
import {QnaStorage} from './largeDocQna'
import {answerMe, createEmbedding} from './openaiFacade'
import {VectorStore} from 'langchain/vectorstores/base'
import {ConversationalRetrievalQAChain, LLMChain} from 'langchain/chains'
import {drop, pick} from 'lodash'
import {Document} from 'langchain/document'
import {BufferMemory} from 'langchain/memory'
import {BaseRetriever} from 'langchain/dist/schema/retriever'
import {PromptTemplate} from 'langchain/prompts'


interface QnaInput<VS extends VectorStore> {
  question: string,
  vectorStore: VS,
  filter?: VS['FilterType'],
  searchText?: string,
  prompt?: string,
  summary?: string,
  strategy?: keyof typeof qnaStrategyMap
}

type QnaStrategyFunction = <VS extends VectorStore>(args: QnaInput<VS>) => Promise<{
  answer: string | undefined;
  similarities: Document[]
}>

const qnaStrategyMap: Record<string, QnaStrategyFunction> = {
  'default': performQna2WithReason,
  'general-guess': performQnaWithGeneralGuess,
  'question':performQnaFromOneSourceWithGeneralGuess,
  'one-source': performQnaFromOneSource
}

// keys of qnaStrategyMap
export const qnaStrategyNames = Object.keys(qnaStrategyMap)

export async function performQna<VS extends VectorStore>(args: QnaInput<VS>): Promise<{
  answer: string | undefined;
  similarities: Document[]
}> {
  const strategy = args.strategy ?? 'default'
  const fn = qnaStrategyMap[strategy]
  if (!fn) throw new Error(`${strategy} is not a valid strategy`)
  return await fn(args)
}


const generalKnowledgePrompt = PromptTemplate.fromTemplate(
  `You are an AI assistant to help players of the game Star Trek Timelines by answering questions based on knowledge from the sttwiki. Answer questions as directly as possible. Be concise in your response.

  QUESTION: {question}

  ANSWER:
`
)

const questionPrompt = PromptTemplate.fromTemplate(
  `You are a SAMPLE TEXT generator, providing sample text that may appear in a document that is described in DOCUMENT SUMMARY. The SAMPLE TEXT contains the answer that would address a QUESTION being posed.

DOCUMENT SUMMARY: {summary}

QUESTION: {question}

SAMPLE TEXT:`
);

async function performQnaWithGeneralGuess<VS extends VectorStore>(args:QnaInput<VS>) {
  const model = getOpenAIChat()
  const chainA = new LLMChain({llm: model, prompt: generalKnowledgePrompt});
  const resA = await chainA.call({ question: args.question, verbose: false });
  const betterSearch = resA.text
  return await performQna2WithReason({searchText:betterSearch, ...args})
}

async function performQnaFromOneSourceWithGeneralGuess<VS extends VectorStore>(args:QnaInput<VS>) {
  const model = getOpenAIChat()
  const chainA = new LLMChain({llm: model, prompt: generalKnowledgePrompt});
  const resA = await chainA.call({ question: args.question, verbose: false });
  const betterSearch = resA.text
  return await performQnaFromOneSource({searchText:betterSearch, ...args})
}

async function performQnaFromOneSource<VS extends VectorStore>(args:QnaInput<VS>) {

  const simSearchText = args.searchText ?? args.question
  logger.info(`SEARCH: ${simSearchText}`)
  const bestMatches = await args.vectorStore.similaritySearch(simSearchText, 1, args.filter)

  const bestMatch = bestMatches[0]
  const bestFileName = bestMatch.metadata['fileName']
  logger.info(`Restrict retrieval to ${bestFileName}`)

  // FIXME: this is making assumptions about FilterType
  let smallerFilter: VS['FilterType'];
  if (typeof args.filter === 'function') {
    // Assume existing per MemoryVectorStore
    const existing = args.filter as (doc: Document) => boolean
    const v2:(doc: Document) => boolean = (doc) => (doc.metadata['fileName']===bestFileName) && existing(doc)
    smallerFilter = v2;
  } else if (typeof args.filter === 'object') {
    // If args.filter is an object (e.g., Record<string, any>), construct smallerFilter as needed
    smallerFilter = { ...args.filter, ...pick(bestMatch.metadata, ['fileName']) };
  } else if (args.filter === undefined) {
    throw new Error(`args.filter is undefined`)
  } else {
    throw new Error(`args.filter must be a function or an object. Got ${typeof args.filter}`)
  }

  // question, vectorStore, smallerFilter, simSearchText, prompt
  return await performQna2WithReason({searchText:simSearchText, filter:smallerFilter, ...args} )
}

/**
 * Performs Q&A with HyDE.
 * Generates an improved embedding search by first answering with general LLM knowledge
 * @see https://gpt-index.readthedocs.io/en/v0.6.9/how_to/query/query_transformations.html
 */
async function performQnaWithSummaryContext<VS extends VectorStore>(args:QnaInput<VS>) {
  const model = getOpenAIChat()
  const chainA = new LLMChain({ llm: model, prompt: questionPrompt });

  let betterSearch:string|undefined = undefined
  if (args.summary) {
// The result is an object with a `text` property.
    const resA = await chainA.call({ summary: args.summary, question: args.question, verbose: true });
    betterSearch = resA.text
    return await performQna2WithReason({searchText: betterSearch, ...args})
  }
  else {
    logger.info('No summary provided, using general knowledge')
    return await performQnaFromOneSourceWithGeneralGuess(args)
  }

// debugger


}

async function performQna2WithReason<VS extends VectorStore>(args:{question:string, vectorStore: VectorStore, filter?:VS['FilterType'], searchText?:string, prompt?: string}): Promise<{answer:string|undefined, similarities: Document[]}> {
  const simSearchText = args.searchText ?? args.question
  console.log(`SEARCH: ${simSearchText}`)
  const similarities = await args.vectorStore.similaritySearch(simSearchText, 10, args.filter)
  const contexts = []
  let contextLength = 0
  const MAX_CONTEXT_LENGTH = 3000 // Maximum ~3500 tokens. But chars/token ratio is about 4

  for (const similarity of similarities) {
    const input = similarity.pageContent
    if (input.length+contextLength > MAX_CONTEXT_LENGTH) {
      break
    }
    contexts.push(input)
    contexts.forEach(c => logger.info(`${similarity.metadata.fileName} ${input}`))
    contextLength += input.length
  }

  logger.info(`best inputs: ${contexts.length} snippets`)
  if (contexts.length>0) {
    const bestInput = contexts.join('\n')
    const answer = await answerMe({context: bestInput, userPrompt: args.question, initPrompt: args.prompt})
    return {answer, similarities}
  } else {
    return {answer:undefined, similarities}
  }
}

export async function performQnaOrig(question:string, storage: QnaStorage, prompt?: string): Promise<string|undefined> {
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

export interface MyChatMessage {
  id: string
  conversationId: string
  role: 'system' | 'user' | 'ai'
  parentMessageId?: string
  message: string
  timestamp: any
}

export function chatHistoryFromChatDocs(docs: Partial<MyChatMessage>[]): string {
  return docs.map(chat => {
    if (chat.role === 'user') {
      return `Human: ${chat.message??''}`
    } else if (chat.role === 'ai') {
      return `Assistant: ${chat.message??''}`
    } else if (chat.role === 'system') {
      // langchainjs doesn't support system yet! We may need to dodge langchain
      return `Assistant: ${chat.message??''}`
    } else {
      logger.warn(`unknown chat.role ${chat.role}`)
      // apply some default
      return `Assistant: ${chat.message??''}`
    }
  }).join('\n')

}

export async function memoryFromChatDocs(docs: Partial<MyChatMessage>[]) {
  const memory = new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'question',
    outputKey: 'text',
    returnMessages: true
  })
  const lastMessage = docs[0]
  docs = drop(docs, 1)

  docs.map(async (doc) => {
    const chat = doc as Partial<MyChatMessage>
    if (chat.role === 'user') {
      await memory.chatHistory.addUserMessage(chat.message ?? '')
    } else if (chat.role === 'ai') {
      await memory.chatHistory.addAIChatMessage(chat.message ?? '')
    } else if (chat.role === 'system') {
      // Assume system belongs to ai for now
      await memory.chatHistory.addAIChatMessage(chat.message ?? '')
    } else {
      logger.warn(`unknown chat.role ${chat.role}`)
      // apply some default
      await memory.chatHistory.addUserMessage(chat.message ?? '')
    }
  })
  return {memory, lastMessage}
}

export async function performConversation(args:{docs: Partial<MyChatMessage>[], retriever: BaseRetriever, question: string}) {
  const model = getOpenAIChat()
  const {memory} = await memoryFromChatDocs(args.docs)

  const chain = ConversationalRetrievalQAChain.fromLLM(model, args.retriever, {
    returnSourceDocuments: true,
    memory,
    questionGeneratorChainOptions:{
      llm: model
    }
  })
  logger.info(`asking question ${args.question} with ${args.docs.length} of total messages`)
  const res = await chain.call({question: args.question})
  return res
}




const jsonFieldNamer = PromptTemplate.fromTemplate(
  `You are JSON schema designer. Your role is to consider a QUESTION whose answer will be stored as JSON in a document store and determine an appropriate FIELD NAME for the answer to be stored in JSON.
  The FIELD NAME should use sentence casing. Do not surround with quotes.

  QUESTION: What is the first name?

  FIELD NAME: First Name

  QUESTION: {question}

  FIELD NAME:
`
)


export async function listQuery(args:{contexts:string[], questions:string[], initPrompt?: string, progress?: (progress: number) => void}) {
  const {contexts, questions, initPrompt} = args
  const model = getOpenAIChat()
  const chainA = new LLMChain({ llm: model, prompt: jsonFieldNamer });

  const totalProgress = questions.length + (contexts.length * questions.length)
  let currentProgress = 0

  const doProgress = () => {
    currentProgress += 1
    if (args.progress) {
      args.progress(currentProgress / totalProgress)
    }
  }

  const fields = await Promise.all(questions.map(async question => {
    doProgress()
    const resA = await chainA.call({ question, verbose: true });
    return resA.text as string
  }))
  const rows = await Promise.all(contexts.map(async context => {
    const row:Record<string, string> = {context}
    const answers = await Promise.all(questions.map(async (question, qidx) => {
      doProgress()
      const answer:string = await answerMe({context: context, userPrompt: question, initPrompt})
      const field = fields[qidx]
      row[field] = answer
      return answer
    }))
    return row
  }))
  return {fields, rows}
}
