import {defineStore} from 'pinia'
import {includes} from 'lodash'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {OpenAIEmbeddingsWithMemo} from '../lib/ai/EmbeddingsWithCache'
import {getLangchainConfig, getLangchainEmbedConfig} from '../lib/ai/config'
import {embedsCache} from '../lib/ai/openaiWrapper'
import {blobToChunks, fileToChunks} from '../lib/ai/unstructured'
import {DocumentInfo} from './multiFileStore'
import {MetaFilter} from '../../functions/src/types'

interface MemoryVector {
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export const useMultiFileLocalStore = defineStore('multiFileLocal', {

  state: () => ({
    documentInfo: [] as DocumentInfo[],
    memoryVectors: [] as MemoryVector[],
    workspace: 'default',
    workspaceInfo: [{name: 'default'}]
  }),
  getters: {
    processing: (state): boolean => state.documentInfo.some(file => includes(['processing', 'parsing'], file.fileStatus)),
    allText: (state) => state.documentInfo.map(d => d.text).join(' '),
    currentWorkspaceInfo (state):any {
      return this?.workspaceInfo?.find( (x:any) => x.name === state.workspace)
    },
  },
  actions: {
    getVectorStore() {
      const ret = new MemoryVectorStore(new OpenAIEmbeddingsWithMemo(getLangchainEmbedConfig(), undefined, embedsCache))
      ret.memoryVectors = this.memoryVectors
      return ret
    },
    getRetriever() {
      return this.getVectorStore().asRetriever()
    },
    async subscribe() {
      // Nothing. we are in memory
    },
    async addFile(file: File) {
      const text = await file.text()
      this.documentInfo.push({
        fileName: file.name,
        file,
        text: text,
        fileStatus: 'pending',
        fileLastModified: file.lastModified,
        fileSize: file.size,
        progress: undefined
      })
      return `Uploaded ${file.name}!`
    },
    async deleteFile(fileName: string) {
      this.documentInfo = this.documentInfo.filter(x => x.fileName !== fileName)
      this.memoryVectors = this.memoryVectors.filter(x => x.metadata.fileName !== fileName)
      // FIXME: remove vectors or regen from cache
    },
    // this method is for testing nodejs contet where browser File is not working
    async addBuffer(buffer: any, name: string) {
      this.documentInfo.push({
        fileName: name,
        buffer,
        fileStatus: 'pending',
        progress: undefined,
        fileLastModified: Date.now(),
        fileSize: buffer.size
      })
    },
    async reindexFile(fileName:string) {
      const doc = this.documentInfo.find(x => x.fileName === fileName)
      await this.deleteFile(fileName)
      doc.fileStatus = 'pending'
      this.documentInfo.push(doc)
      this.processNextDocument() // do not await this
    },
    async updateWorkspace(data:any):Promise<void> {
      this.workspaceInfo = {...this.workspaceInfo, ...data}
    },
    async processNextDocument() {
      const pendingDocument = this.documentInfo.find(doc => doc.fileStatus === 'pending')

      if (pendingDocument) {
        // Set the status to 'parsing'
        pendingDocument.fileStatus = 'parsing'

        try {
          const regexString = "(^Article\\s+\\d+)"; // TODO: pull this from some config
          const regex = new RegExp(regexString, 'im')

          let docs
          if (pendingDocument.buffer) {
            const metadata: MetaFilter = {
              fileName: pendingDocument.fileName,
              fileLastModified: pendingDocument.fileLastModified,
              userId: 'localhost',
              workspace: this.workspace
            }
            docs = await blobToChunks(pendingDocument.buffer, metadata, regex)
          } else {
            docs = await fileToChunks(pendingDocument.file!, regex)
          }

          pendingDocument.fileStatus = 'processing'

          // This is slow... need progress callback but awaiting https://github.com/hwchase17/langchainjs/issues/1861
          const vectorStore = this.getVectorStore()
          await vectorStore.addDocuments(docs) // TODO: deduplicate based on metadata?
          this.memoryVectors = vectorStore.memoryVectors // save it

          // Update the status to 'ready' on successful processing
          pendingDocument.fileStatus = 'ready'
        } catch (error) {
          // Set the status to 'error' on processing failure
          pendingDocument.fileStatus = 'error'
          console.error('Error occurred during document processing:', error)
        }

        // Call the processNextDocument function recursively to process the next document
        await this.processNextDocument()
      }
    }
  },
})
