import {defineStore} from 'pinia'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {includes} from 'lodash'
import {markRaw} from 'vue'
import {OpenAIEmbeddingsWithMemo} from 'src/lib/ai/EmbeddingsWithCache';
import {getLangchainConfig} from 'src/lib/ai/config';
import {embedsCache} from 'src/lib/ai/openaiWrapper';
import {anyBufferToText, fileToText} from 'src/lib/ai/unstructured';
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

export const useMultiFileStoreBrowser = defineStore('multiFile', {
  state: () => ({
    documentInfo: [] as DocumentInfo[] ,
    vectorStore: markRaw(new MemoryVectorStore(new OpenAIEmbeddingsWithMemo(getLangchainConfig(), undefined, embedsCache)))
  }),
  getters: {
    processing: (state):boolean => state.documentInfo.some(file => includes([ 'processing', 'parsing'], file.fileStatus)),

  },
  actions: {
    getRetriever() {
      return this.vectorStore.asRetriever()
    },
    async subscribe() {
      // Nothing. we are in memory
    },
    async addFile(file:File) {
      this.documentInfo.push({ fileName:file.name, file, fileStatus: 'pending', fileLastModified: file.lastModified, fileSize: file.size, progress: undefined});
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
          const vectorStore = this.vectorStore
          await vectorStore.addDocuments(docs) // TODO: deduplicate based on metadata?

          // Important to markRaw to avoid proxying the insides
          // pendingDocument.vectors = markRaw(vectorStore)
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

