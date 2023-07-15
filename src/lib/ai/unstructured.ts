import axios from 'axios'
import {getUnstructuredEndpoint} from 'src/lib/ai/config'

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

export async function fileToText(file:File) {
  const elems = await fileToPartitions(file)
  return partitionsToText(elems)
}

export async function anyBufferToText(buffer: any, name:string) {
  const form = new FormData();
  form.append('files', buffer, name);

  const response = await fetch(getUnstructuredEndpoint(),
    {method: 'POST', body: form})

  // const response = await axios.post(
  //   getUnstructuredEndpoint(),
  //   form
  // );
   if (response.ok) {
    const json = await response.json()

    return partitionsToText(json)
  } else {
    const text = await response.json()
    throw new Error(text)
  }

}


function partitionsToText(elemsOrig: Partial<UnstructuredElement>[]) {
  const elems = elemsOrig.filter((el:any) => typeof el?.text === 'string')
  if (!Array.isArray(elems)) {
    throw new Error(
      `Expected partitioning request to return an array, but got ${elems}`
    );
  }
  const texts:string[] = elems.map(x => x.text!)
  // TODO: Consider determine elem type to use '\n' or '\n\n' instead of ' '
  return texts.join(' ')
}

export async function fileToPartitions(file:File):Promise<Partial<UnstructuredElement>[]> {
  const formData = new FormData();
  formData.append('files', file, file.name);
  const url = getUnstructuredEndpoint()
  const response = await axios.post(url, formData, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data

}
