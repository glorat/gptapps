import axios from 'axios'

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
  const texts:string[] = elems.map(x => x.text!)
  // TODO: Consider determine elem type to use '\n' or '\n\n' instead of ' '
  return texts.join(' ')
}

export async function fileToPartitions(file:File):Promise<Partial<UnstructuredElement>[]> {
  const url = 'https://unstructured-api-plgktvor2a-as.a.run.app/general/v0/general';

  const formData = new FormData();
  formData.append('files', file, file.name);
  const response = await axios.post(url, formData, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  });

  const elems = response.data.filter((el:any) => typeof el?.text === 'string')
  if (!Array.isArray(elems)) {
    throw new Error(
      `Expected partitioning request to return an array, but got ${elems}`
    );
  }
  return elems

}
