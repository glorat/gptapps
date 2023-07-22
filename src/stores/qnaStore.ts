import {defineStore} from 'pinia'
import {BufferMemory} from 'langchain/memory'
import {markRaw} from 'vue'
import {ConversationalRetrievalQAChain} from 'langchain/chains'
import {getOpenAIChat} from '../lib/ai/config'
import {useMultiFileStore} from './multiFileStore'

const newBufferMemory = () => {
  return new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'question',
    outputKey: 'text',
    returnMessages: true
  })
}

export const useQnaStore = defineStore('qnaStore', {
  state: () => ({
    memory: markRaw(newBufferMemory())
  }),
  actions: {
    async performVectorStoreQna (args: {question:string}) {
      // FIXME: This won't work for remote
      const retriever = useMultiFileStore().retriever

      const model = getOpenAIChat()
      const memory = this.memory
      const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
        returnSourceDocuments: true,
        memory,
        questionGeneratorChainOptions:{
          llm: model
        }
      })
      const res = await chain.call(args)
      return res
    },
    resetChat() {
      this.memory = markRaw(newBufferMemory())
    }
  }
})
