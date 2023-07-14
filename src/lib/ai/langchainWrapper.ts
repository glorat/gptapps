import {getOpenAIChat} from 'src/lib/ai/config';
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {BufferMemory} from 'langchain/memory';

import {useMultiFileStore} from 'stores/multiFileStore';



const memory =  new BufferMemory({
  memoryKey: 'chat_history',
  inputKey: 'question',
  outputKey: 'text',
  returnMessages: true
})

const currentVectorStore = () => {
  const multiFileStore = useMultiFileStore()
  return multiFileStore.vectorStore
}

export const performVectorStoreQnaDirect = async (args: {question:string}) => {

  const model = getOpenAIChat()
  const chain = ConversationalRetrievalQAChain.fromLLM(model, currentVectorStore().asRetriever(), {
    returnSourceDocuments: true,
    memory,
    questionGeneratorChainOptions:{
      llm: model
    }
  })
  const res = await chain.call(args)
  return res
}
