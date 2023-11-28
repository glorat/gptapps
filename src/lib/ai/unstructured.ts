import axios from 'axios'
import {getUnstructuredEndpoint} from './config'
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {Document} from 'langchain/document'
import {MetaFilter} from '../../../functions/src/types'
import {logger} from './logger'

// const FormData = require('form-data');
export interface UnstructuredMetadata {
  filetype: string
  page_number: number
  filename: string
}

export interface UnstructuredElement {
  type: string
  coordinate_system: unknown
  layout_width: unknown
  layout_height: unknown
  element_id: string
  metadata: UnstructuredMetadata
  text: string
}

export async function fileToText(file: File) {
  const elems = await fileToPartitions(file)
  return partitionsToText(elems)
}

function partitionsToChunks(metadata: any, json: Partial<UnstructuredElement>[], regex?: RegExp) {
  let lastMatch = ''
  const docs = json.map(elem => {
    // If a regex is provided, test the current element's text.
    if (regex && elem.text) {
      const match = elem.text.match(regex);
      if (match && match[1]) {
        // Update the last match if a new match is found.
        logger.info(`New header found: ${match[1]}`)
        lastMatch = match[1];
      }
    }
    // be selective on unstructured metadata
    const moreMetadata = {...metadata, pageNumber: elem.metadata?.page_number ?? 0, header: lastMatch}
    const input = {pageContent: elem.text!, metadata: moreMetadata}
    // const input = {pageContent: elem.text!, metadata: {...elem.metadata, ...metadata, header: lastMatch}}
    return new Document(input)
  })

  return docs
}

export async function fileToChunks(file: File, headerRegex?:RegExp) {
  const json = await fileToPartitions(file)
  const metadata = {
    // userId,
    // workspace,
    filePath: file.name,
    fileName: file.name,
    fileLastModified: file.lastModified
  }
  return partitionsToChunks(metadata, json, headerRegex)
}

export async function bufferToChunks(buffer: Buffer, name: string, headerRegex?:RegExp) {
  const json = await bufferToPartitions(buffer, name)
  const metadata = {
    // userId,
    // workspace,
    filePath: name,
    fileName: name,
    fileLastModified: Date.now()
  }
  return partitionsToChunks(metadata, json, headerRegex)
}

export async function blobToChunks(buffer: any, metadata: { fileName: string }, headerRegex?:RegExp): Promise<Document<Partial<MetaFilter>>[]> {
  const json = await anyBufferToElems(buffer, metadata.fileName)
  return partitionsToChunks(metadata, json, headerRegex)

}

// This function is redundant
async function blobToChunksNaive(buffer: Blob, metadata: { filePath: string }) {
  const text = await anyBufferToText(buffer, metadata.filePath)
  const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000})
  const metadatas = [metadata]
  const docs = await textSplitter.createDocuments([text], metadatas)
  return docs
}


function applyFormDataDefaults(formData: {append: (arg0: string, arg1: string) => void}) {
  formData.append('chunking_strategy', 'by_title')
  formData.append('combine_under_n_chars', '2000') // default 500
  formData.append('multipage_sections', 'true') // default false (but docs say true)
  formData.append('new_after_n_chars', '10000') // default 1500
  formData.append('max_characters', '10000') // default 1500

}

async function anyBufferToElems(buffer: Blob, name: string):Promise<Partial<UnstructuredElement>[]> {
  if (!name) {
    throw new Error('name must be string for anyBufferToElems')
  }
  const formData = new FormData()
  formData.append('files', buffer, name)
  applyFormDataDefaults(formData)
  console.log(`anyBufferToText to ${getUnstructuredEndpoint()} for ${buffer.size} bytes of ${name}`)

  const response = await fetch(getUnstructuredEndpoint(),
    {method: 'POST', body: formData})

  // const response = await axios.post(
  //   getUnstructuredEndpoint(),
  //   form
  // );
  if (response.ok) {
    const json = await response.json()
    console.log(`${json.length} partitions of text returned`)
    return json
  } else {
    const text = await response.json()
    throw new Error(text)
  }
}

export async function anyBufferToText(buffer: Blob, name: string) {
  const json = await anyBufferToElems(buffer, name)
  return partitionsToText(json)
}


function partitionsToText(elemsOrig: Partial<UnstructuredElement>[]) {
  const elems = elemsOrig.filter((el: any) => typeof el?.text === 'string')
  if (!Array.isArray(elems)) {
    throw new Error(
      `Expected partitioning request to return an array, but got ${elems}`
    )
  }
  const texts: string[] = elems.map(x => x.text!)
  // TODO: Consider determine elem type to use '\n' or '\n\n' instead of ' '
  return texts.join(' ')
}

export async function bufferToPartitions(buffer: Buffer, name: string) {
  const {default: FD} = await import('form-data');
  const formData = new FD()

  formData.append('files', buffer, name)
  applyFormDataDefaults(formData)

  const url = getUnstructuredEndpoint()
  const response = await axios.post(url, formData, {
    headers: {
      'Accept': 'application/json',
      ...formData.getHeaders()
    },
  })
  return response.data
}

export async function fileToPartitions(file: File): Promise<Partial<UnstructuredElement>[]> {
  const formData = new FormData()
  formData.append('files', file, file.name)
  applyFormDataDefaults(formData)
  const url = getUnstructuredEndpoint()
  const response = await axios.post(url, formData, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data

}
