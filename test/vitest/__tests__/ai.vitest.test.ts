import {describe, it, expect} from 'vitest'
import {createQnaStorageFromLargeContent, createVectorStoreFromLargeContent} from 'src/lib/ai/largeDocQna'
import {performQna, performQna2} from 'src/lib/ai/answer'
import {embedsCache} from 'src/lib/ai/openaiWrapper'

const testContent = 'Let it be known that 2+2=5 and that 4+4=9'

describe('ai', () => {
  it('should start with empty embeds cache', () => {
    expect(embedsCache.size == 0)
  })
  it('should perform qna', async () => {
    const storage = await createQnaStorageFromLargeContent(testContent)
    const question = 'Based on what is known what is 2+2? Just give the answer without explanation nor punctuation'
    const response = await performQna(question, storage)
    expect(response).eq('5')
  })
  it('should perform qna2', async () => {
    const storage = await createVectorStoreFromLargeContent(testContent)
    const question = 'Based on what is known what is 2+2? Just give the answer without explanation nor punctuation'
    const response = await performQna2(question, storage)
    expect(response).eq('5')
  })
  it('should now have cached items', () => {
    expect(embedsCache.size == 1)
  })
  it('should memo embeds', async () => {
    await createQnaStorageFromLargeContent(testContent)
    expect(embedsCache.size == 1)
  })
})
