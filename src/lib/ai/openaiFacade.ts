import {logger} from 'src/lib/ai/logger'
import {getFunctions, httpsCallable} from 'firebase/functions';
import {fbGetApp} from 'src/lib/myfirebase'
import {answerMeDirect, createEmbeddingDirect, createTranscriptionDirect} from 'src/lib/ai/openaiWrapper'

const FUNCTIONS_REGION = 'asia-northeast1'

// The keyhole invoker to manage execution strategies
async function doGeneric<ARG,RES>(args:ARG, functionName:string, fn: (args:ARG) => RES) {
  const directCall = true
  if (!directCall) {
    const functions = getFunctions(fbGetApp(), FUNCTIONS_REGION)
    // Call Firebase Cloud Function to validate video
    const fn = httpsCallable(functions, functionName);
    const res = await fn(args)
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
