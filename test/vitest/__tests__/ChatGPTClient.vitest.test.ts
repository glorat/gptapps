import {describe, it, expect} from 'vitest'

import ChatGPTClient from "src/lib/ai/ChatGPTClient";
import {sendChatMessage} from 'src/lib/ai/openaiFacade'

const createCache = (cache:Record<string, any>) => {
  const getCache = async(id:string):Promise<any> => cache[id]
  const setCache = async(id:string, value:any):Promise<void> => {
    // console.log(`setting cache ${id} to `, value)
    cache[id] = value
    return
  }
  const convCache = {get:getCache, set:setCache}
  return convCache
}

describe('ChatGPTClient', async () => {
  let client: ChatGPTClient
  const cache:Record<string, any> = {}
  const convCache = createCache(cache)

  let conversationId: string;
  let messageId: string;
  it('should send a message', async () => {
    const res = await sendChatMessage({message:'My name is John Smith. What is my name?', cache:convCache});
    conversationId = res.conversationId;
    messageId = res.messageId;
    const { response } = res;
    expect(response).toContain('John Smith');
  });

  it('should handle follow-up', async () => {
    const res2 = await sendChatMessage({message:'Please repeat just my name?', chatOptions:{
      conversationId,
      parentMessageId: messageId,
    }, cache:convCache});
    expect(res2.response).toContain('John Smith');

    console.log(cache[conversationId])
  });
})

describe('ChatGPTClient with bad key', async () => {
  let client: ChatGPTClient
  const cache:Record<string, any> = {}

  it('should init client', () => {
    const convCache = createCache(cache)
    client = new ChatGPTClient('A bad key', {}, convCache)
  })

  it('should error on send', async () => {
    try {
      await client.sendMessage('hello')
    }
    catch (e:any) {
      console.log((e as Error).message)
      expect(e).toMatchSnapshot()
    }

  })
})

describe('ChatGPTClient streaming', () => {
  const cache:Record<string, any> = {}

  it('should stream a message', async () => {
    const chunks:string[] = []
    const convCache = createCache(cache)
    const clientOptions = {onProgress: (x:string) => chunks.push(x)}
    const res = await sendChatMessage({message:'Generate 50 words of random text?', clientOptions, cache:convCache})
    const { response } = res;
    // Accumulated stream should match final message
    expect(response).toEqual(chunks.join(''))
    expect(response).toMatch('Sure');
  }, {timeout: 30000});
})
