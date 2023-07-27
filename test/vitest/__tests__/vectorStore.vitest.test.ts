// @vitest-environment node

import {describe, it, expect} from 'vitest'

import {useMultiFileStoreBrowser} from 'stores/multiFileStore'
import {Document} from 'langchain/document'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {createPinia, setActivePinia} from 'pinia'
describe('vectorStore', () => {
  setActivePinia(createPinia())

  it('should ensure MemoryVectorStore cloneable', () => {
    const store = useMultiFileStoreBrowser().getVectorStore()
    store.addVectors([[0,1],[2,3]], [
      new Document({pageContent:'0,1'}),
      new Document({pageContent:'2,3'})
    ])
    const vs = store.memoryVectors
    const newStore = new MemoryVectorStore(store.embeddings)
    newStore.memoryVectors = JSON.parse(JSON.stringify(vs))

    expect(newStore.memoryVectors).toMatchObject(vs)
  })
})
