import {defineStore} from 'pinia'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {includes} from 'lodash'
import {markRaw, shallowRef} from 'vue'
import {OpenAIEmbeddingsWithMemo} from 'src/lib/ai/EmbeddingsWithCache';
import {getLangchainConfig} from 'src/lib/ai/config';
import {embedsCache} from 'src/lib/ai/openaiWrapper';
import {anyBufferToText, fileToText} from 'src/lib/ai/unstructured';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';

export interface DocumentInfo {
  name: string
  file?: File
  buffer?: Buffer
  status: 'pending' | 'parsing' | 'processing' | 'ready' | 'error'
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
      this.documentInfo.push({ name:file.name, file, status: 'pending', progress: undefined});
    },
    addBuffer(buffer:any, name:string) {
      this.documentInfo.push({ name, buffer, status: 'pending', progress: undefined });
    },
    async processNextDocument() {
      const pendingDocument = this.documentInfo.find(doc => doc.status === 'pending');

      if (pendingDocument) {
        // Set the status to 'parsing'
        pendingDocument.status = 'parsing';

        try {
          let text
          if (pendingDocument.buffer) {
            text = await anyBufferToText(pendingDocument.buffer, pendingDocument.name)
          } else {
            text = await fileToText(pendingDocument.file!)
          }

          pendingDocument.status = 'processing'

          const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

          // This is slow... need progress callback but awaiting https://github.com/hwchase17/langchainjs/issues/1861
          const docs = await textSplitter.createDocuments([text], [{name: pendingDocument.name}])
          // This is the old way which supports progress tracking
          // const vectorStore = await createVectorStoreFromLargeContent(text, (p)=>{pendingDocument.progress=p})
          const vectorStore = this.vectorStore
          await vectorStore.addDocuments(docs) // TODO: deduplicate based on metadata?

          // Important to markRaw to avoid proxying the insides
          // pendingDocument.vectors = markRaw(vectorStore)
          // Update the status to 'ready' on successful processing
          pendingDocument.status = 'ready';
        } catch (error) {
          // Set the status to 'error' on processing failure
          pendingDocument.status = 'error';
          console.error('Error occurred during document processing:', error);
        }

        // Call the processNextDocument function recursively to process the next document
        await this.processNextDocument();
      }
    }
  },
})

