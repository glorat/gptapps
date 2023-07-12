import {defineStore} from 'pinia'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {includes} from 'lodash'
import {markRaw, shallowRef} from 'vue'
import {OpenAIEmbeddingsWithMemo} from 'src/lib/ai/EmbeddingsWithCache';
import {getLangchainConfig} from 'src/lib/ai/config';
import {embedsCache} from 'src/lib/ai/openaiWrapper';

export interface DocumentInfo {
  file: File;
  status: 'pending' | 'parsing' | 'processing' | 'ready' | 'error';
  progress?: number,
  // vectors?: MemoryVectorStore
}

export const useMultiFileStore = defineStore('multiFile', {
  state: () => ({
    documentInfo: [] as DocumentInfo[] ,
    vectorStore: markRaw(new MemoryVectorStore(new OpenAIEmbeddingsWithMemo(getLangchainConfig(), undefined, embedsCache)))
  }),
  getters: {
    processing: (state):boolean => state.documentInfo.some(file => includes([ 'processing', 'parsing'], file.status))
  },
  actions: {
    addFile(file:File) {
      this.documentInfo.push({ file, status: 'pending', progress: undefined });
    },
  },
})
