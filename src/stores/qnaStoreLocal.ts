import {defineStore} from 'pinia'
import {v4} from 'uuid'
import {useMultiFileStoreAsync} from './multiFileStore'
import {BufferMemory} from 'langchain/memory'
import {MyChatMessage, performConversation} from '../lib/ai/answer'

const newBufferMemory = () => {
  return new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'question',
    outputKey: 'text',
    returnMessages: true
  })
}


export const useQnaStoreBrowser = defineStore('qnaStore', {
  state: () => ({
    messages: []
  }),
  actions: {
    async subscribe():Promise<void> {
      // Nothing doing, messages is reactive
    },
    async performVectorStoreQna (args: {question:string}) {
      const msg:MyChatMessage = {id: v4(), message: args.question, role: 'user', conversationId:'default', timestamp: Date.now()}
      this.messages.push(msg)
      const retriever = (await useMultiFileStoreAsync()).getRetriever()
      const res = await performConversation({docs: this.messages, retriever, question: args.question})
      this.messages.push({id: v4(), message: res.text, role: 'ai'})
      return res
    },
    async similaritySearchWithScore(args: { query: string, k?: number, filter?: any }) {
      throw new Error('not implemented')
    },
    resetChat() {
      this.messages = []
    }
  }
})
