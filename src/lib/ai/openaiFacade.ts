import {getFunctions, httpsCallable} from 'firebase/functions'
import {fbGetApp} from '../myfirebase'
import OpenAI from 'openai'

const FUNCTIONS_REGION = undefined // 'asia-northeast1'

// The keyhole invoker to manage execution strategies
export async function doGeneric<ARG,RES>(args:ARG, functionName:string, remoteFnName: string, directCall = true) {
  if (!directCall) {
    const functions = getFunctions(fbGetApp(), FUNCTIONS_REGION)
    const fn = httpsCallable(functions, 'genCall');
    try {
      const res = await fn({...args, function: functionName})
      return res.data as RES
    }
    catch (e) {
      console.error(e)
      throw e
    }
  } else {
    if (process.env.PROD) {
      throw new Error('no local calls in prod')
    } else {
      const wrapper:any = await import('./openaiWrapper')
      return wrapper[remoteFnName](args)
    }

  }
}

export async function answerMe(arg: {context: string, userPrompt: string, initPrompt?:string}) {
  return await doGeneric(arg, 'answerMe', 'answerMeDirect')
}

export async function createEmbedding(arg: {input:string}) {
  return await doGeneric(arg, 'createEmbedding', 'createEmbeddingDirect')
}

export async function createTranscription(arg: {blob:Blob}) {
  return await doGeneric(arg, 'createTranscription', 'createTranscriptionDirect')
}

export async function createImage(arg: {request:OpenAI.Images.ImageGenerateParams}): Promise<OpenAI.ImagesResponse> {
  return await doGeneric(arg, 'createImage', 'createImageDirect')
}

/* : Promise<ReturnType<typeof sendChatMessageDirect>> */
export async function sendChatMessage(arg:{message:string, clientOptions?:any, chatOptions?:any, cache: any}) {
  return await doGeneric(arg, 'sendChatMessage', 'sendChatMessageDirect')
}

export async function similaritySearchWithScore(arg: {query: string, workspace: string, k?: number, filter?: any}) {
  return await doGeneric(arg, 'similaritySearchWithScore', 'similaritySearchWithScoreDirect')
}
