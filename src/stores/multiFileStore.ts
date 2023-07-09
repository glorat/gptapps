import {defineStore} from 'pinia'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {includes} from 'lodash'
import {shallowRef} from 'vue'

export interface DocumentInfo {
  file: File;
  status: 'pending' | 'parsing' | 'processing' | 'ready' | 'error';
  progress?: number,
  vectors?: MemoryVectorStore
}

export const useMultiFileStore = defineStore('multiFile', {
  state: () => ({
    documentInfo: [] as DocumentInfo[] ,
  }),
  getters: {
    processing: (state):boolean => state.documentInfo.some(file => includes([ 'processing', 'parsing'], file.status))
  },
  actions: {
    addFile(file:File) {
      this.documentInfo.push({ file, status: 'pending', progress: undefined, vectors:undefined });
    },
  },
})
