// @vitest-environment node

import {describe, it, expect} from 'vitest'
import {performVectorStoreQna} from 'src/lib/ai/openaiFacade';
import {useMultiFileStore, useMultiFileStoreBrowser} from 'stores/multiFileStore'
import {createPinia, setActivePinia} from 'pinia';

import {anyBufferToText} from 'src/lib/ai/unstructured';
import {useQnaStore} from 'stores/qnaStore'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import {Document} from 'langchain/document'

describe('retrieveQna', () => {
  setActivePinia(createPinia())
  const store = useMultiFileStore()

  // This test will prime the cold-start in case online endpoint is used
  it ('should process a file', async() => {
    const rs = new Blob(['hello'])
    await anyBufferToText(rs, 'test.txt')
  }, 15000)

  it('should load some files', async() => {

    // Create an in-memory file
    // const formData = new FormData()
    // const buffer = Buffer.from('hello', 'utf-8')
    const buffer = new Blob(['The answer to the ultimate question is 43'])


    await useMultiFileStore().addBuffer(buffer, 'test.txt')
    expect (useMultiFileStore().documentInfo.length).toEqual(1)
  })

  it('should process documents', async() => {
    expect(store.documentInfo[0].fileStatus).toEqual('pending')
    await store.processNextDocument()
    expect(store.documentInfo[0].fileStatus).toEqual('ready')
  }, 20000)

  it('should answer from store', async () => {
    const msg = 'What is the answer to the ultimate question?'
    const res = await useQnaStore().performVectorStoreQna( {question:msg} )
    expect (res.text).toContain('43')
  }, 20000)
})
