import {defineStore} from 'pinia'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {includes} from 'lodash'
import {markRaw} from 'vue'
import {OpenAIEmbeddingsWithMemo} from '../lib/ai/EmbeddingsWithCache';
import {getLangchainConfig} from '../lib/ai/config';
import {embedsCache} from '../lib/ai/openaiWrapper';
import {anyBufferToText, fileToText} from '../lib/ai/unstructured';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {useMultiFileRemoteStore} from './multiFileRemoteStore'
import {fbHasUser} from '../lib/myfirebase'

export interface DocumentInfo {
  fileName: string
  fileSize: number
  fileLastModified: number
  fileType?: string
  file?: File
  buffer?: Buffer
  fileStatus: 'pending' | 'parsing' | 'processing' | 'ready' | 'error'
  progress?: number,
  text?: string
  // vectors?: MemoryVectorStore
}

export const useMultiFileStore = () => {
  // This is not a reactive decision so may lead to race conditions
  if (fbHasUser()) {
    return useMultiFileRemoteStore()
  } else {
    return useMultiFileStoreBrowser()
  }
}

interface MemoryVector {
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}
export const useMultiFileStoreBrowser = defineStore('multiFile', {
  state: () => ({
    documentInfo: [] as DocumentInfo[] ,
    memoryVectors: [] as MemoryVector[],
    vectorStore: markRaw(new MemoryVectorStore(new OpenAIEmbeddingsWithMemo(getLangchainConfig(), undefined, embedsCache)))
  }),
  getters: {
    processing: (state):boolean => state.documentInfo.some(file => includes([ 'processing', 'parsing'], file.fileStatus)),
    allText: (state)=> state.documentInfo.map(d => d.text).join(' ')
  },
  actions: {
    getVectorStore() {
      const ret = new MemoryVectorStore(new OpenAIEmbeddingsWithMemo(getLangchainConfig(), undefined, embedsCache))
      ret.memoryVectors = this.memoryVectors
      return ret
    },
    getRetriever() {
      return this.vectorStore.asRetriever()
    },
    async subscribe() {
      // Nothing. we are in memory
    },
    async addFile(file:File) {
      const text = await file.text()
      this.documentInfo.push({ fileName:file.name, file, text: text, fileStatus: 'pending', fileLastModified: file.lastModified, fileSize: file.size, progress: undefined});
      return `Uploaded ${file.name}!`
    },
    async addBuffer(buffer:any, name:string) {
      this.documentInfo.push({ fileName:name, buffer, fileStatus: 'pending', progress: undefined, fileLastModified:Date.now(), fileSize: buffer.size });
    },
    async processNextDocument() {
      const pendingDocument = this.documentInfo.find(doc => doc.fileStatus === 'pending');

      if (pendingDocument) {
        // Set the status to 'parsing'
        pendingDocument.fileStatus = 'parsing';

        try {
          let text
          if (pendingDocument.buffer) {
            text = await anyBufferToText(pendingDocument.buffer, pendingDocument.fileName)
          } else {
            text = await fileToText(pendingDocument.file!)
          }

          pendingDocument.fileStatus = 'processing'

          const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

          // This is slow... need progress callback but awaiting https://github.com/hwchase17/langchainjs/issues/1861
          const docs = await textSplitter.createDocuments([text], [{name: pendingDocument.fileName}])
          // This is the old way which supports progress tracking
          // const vectorStore = await createVectorStoreFromLargeContent(text, (p)=>{pendingDocument.progress=p})
          const vectorStore = this.getVectorStore()
          await vectorStore.addDocuments(docs) // TODO: deduplicate based on metadata?
          this.memoryVectors = vectorStore.memoryVectors // save it

          // Update the status to 'ready' on successful processing
          pendingDocument.fileStatus = 'ready';
        } catch (error) {
          // Set the status to 'error' on processing failure
          pendingDocument.fileStatus = 'error';
          console.error('Error occurred during document processing:', error);
        }

        // Call the processNextDocument function recursively to process the next document
        await this.processNextDocument();
      }
    }
  },
})

