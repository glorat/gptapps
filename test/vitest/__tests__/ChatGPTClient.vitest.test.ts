import {describe, it, expect} from 'vitest'

import ChatGPTClient from "src/lib/ai/ChatGPTClient";

const cache:Record<string, any> = {}

describe('ChatGPTClient', async () => {
  let client: ChatGPTClient

  it('should init client', () => {
    const getCache = async(id:string):Promise<any> => cache[id]
    const setCache = async(id:string, value:any):Promise<void> => {
      // console.log(`setting cache ${id} to `, value)
      cache[id] = value
      return
    }
    const cache = {get:getCache, set:setCache}
    client = new ChatGPTClient(process.env.OPENAPI_KEY, {}, cache)
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
  });
})

describe('ChatGPTClient streaming', () => {
  let client: ChatGPTClient

  it('should init client', () => {
    const getCache = async(id:string):Promise<any> => cache[id]
    const setCache = async(id:string, value:any):Promise<void> => {
      // console.log(`setting cache ${id} to `, value)
      cache[id] = value
      return
    }
    const cache = {get:getCache, set:setCache}
    const options = {onProgress: (x) => console.log(x)}
    client = new ChatGPTClient(process.env.OPENAPI_KEY, options, cache)
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
