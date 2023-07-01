import {describe, it, expect} from 'vitest'

import ChatGPTClient from "src/lib/ai/ChatGPTClient";

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

  it('should init client', () => {
    const convCache = createCache(cache)
    client = new ChatGPTClient(process.env.OPENAPI_KEY, {}, convCache)
  })
  let conversationId: string;
  let messageId: string;
  const options = {}
  it('should send a message', async () => {
    const res = await client.sendMessage('My name is John Smith. What is my name?', options);
    conversationId = res.conversationId;
    messageId = res.messageId;
    const { response } = res;
    expect(response).toContain('John Smith');
  });

  it('should handle follow-up', async () => {
    const res2 = await client.sendMessage('Please repeat just my name?', {
      conversationId,
      parentMessageId: messageId,
    });
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
  let client: ChatGPTClient
  const cache:Record<string, any> = {}

  it('should init client', () => {
    const convCache = createCache(cache)
    const options = {onProgress: (x) => console.log(x)}
    client = new ChatGPTClient(process.env.OPENAPI_KEY, options, convCache)
  })


  it('should stream a message', async () => {
    const chunks:string[] = []
    const options = {onProgress: (x:string) => chunks.push(x)}
    const res = await client.sendMessage('Generate 50 words of random text?', options);
    const { response } = res;
    // Accumulated stream should match final message
    expect(response).toEqual(chunks.join(''))
    expect(response).toMatch('Sure');
  }, {timeout: 30000});
})
