import {defineStore} from 'pinia'
import {BufferMemory} from 'langchain/memory'
import {markRaw} from 'vue'
import {ConversationalRetrievalQAChain} from 'langchain/chains'
import {getOpenAIChat} from '../lib/ai/config'
import {useMultiFileStore, useMultiFileStoreBrowser} from './multiFileStore'
import {v4} from 'uuid'
import {fbHasUser} from '../lib/myfirebase'
import {useMultiFileRemoteStore} from './multiFileRemoteStore'
import {useQnaStoreRemote} from './qnaStoreRemote'

const newBufferMemory = () => {
  return new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'question',
    outputKey: 'text',
    returnMessages: true
  })
}

export const useQnaStore = () => {
  // This is not a reactive decision so may lead to race conditions
  if (fbHasUser()) {
    return useQnaStoreRemote()
  } else {
    return useQnaStoreBrowser()
  }
}

export const useQnaStoreBrowser = defineStore('qnaStore', {
  state: () => ({
    memory: markRaw(newBufferMemory()),
    messages: []
  }),
  actions: {
    async subscribe():Promise<void> {
      // Nothing doing, messages is reactive
    },
    async performVectorStoreQna (args: {question:string}) {
      this.messages.push({id: v4(), message: args.question, role: 'User'})
      const retriever = useMultiFileStore().getRetriever()
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
      this.messages.push({id: v4(), message: res.text, role: 'Other'})
      return res
    },
    resetChat() {
      this.memory = markRaw(newBufferMemory())
    }
  }
})
