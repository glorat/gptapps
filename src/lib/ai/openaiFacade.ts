import {logger} from 'src/lib/ai/logger'
import {getFunctions, httpsCallable} from 'firebase/functions';
import {fbGetApp} from 'src/lib/myfirebase'
import {
  answerMeDirect,
  createEmbeddingDirect,
  createTranscriptionDirect,
  sendChatMessageDirect
} from 'src/lib/ai/openaiWrapper'
import {CreateImageRequest, ImagesResponse} from 'openai'
import {getOpenAIAPI} from 'src/lib/ai/config'
import {performVectorStoreQnaDirect} from "src/lib/ai/langchainWrapper";

const FUNCTIONS_REGION = undefined // 'asia-northeast1'

// The keyhole invoker to manage execution strategies
export async function doGeneric<ARG,RES>(args:ARG, functionName:string, fn: (args:ARG) => RES, directCall = true) {
  if (!directCall) {
    const functions = getFunctions(fbGetApp(), FUNCTIONS_REGION)
    const fn = httpsCallable(functions, 'genCall');
    const res = await fn({...args, function: functionName})
    return res.data as RES
  } else {
    return fn(args);
  }
}

export async function answerMe(arg: {context: string, userPrompt: string, initPrompt?:string}) {
  return await doGeneric(arg, 'answerMe', answerMeDirect)
}

export async function createEmbedding(arg: {input:string}) {
  return await doGeneric(arg, 'createEmbedding', createEmbeddingDirect)
}

export async function createTranscription(arg: {blob:Blob}) {
  return await doGeneric(arg, 'createTranscription', createTranscriptionDirect)
}

export async function createImage(arg: {request:CreateImageRequest}): Promise<ImagesResponse> {
  return await doGeneric(arg, 'createImage', async () => (await getOpenAIAPI().createImage(arg.request)).data)
}

export async function sendChatMessage(arg:{message:string, clientOptions?:any, chatOptions?:any, cache: any}): Promise<ReturnType<typeof sendChatMessageDirect>> {
  return await doGeneric(arg, 'sendChatMessage', sendChatMessageDirect)
}
