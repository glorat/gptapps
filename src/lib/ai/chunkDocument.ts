import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import {Document} from 'langchain/document';

const chunkSize = 1000
const chunkOverlap = 200

export async function chunkDocument(document: string): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({chunkSize, chunkOverlap})
  const output: Document[] = await splitter.createDocuments([document])
  return output
}

