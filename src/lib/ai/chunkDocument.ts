import {over} from 'lodash'

const chunkSize = 1000;
const overlapRatio = 0.25

export function chunkDocument(document: string): string[] {
  const overlapSize = Math.floor(chunkSize * 1-overlapRatio);

  const chunks: string[] = [];

  let start = 0;
  let end = chunkSize;

  while (start < document.length) {
    if (end >= document.length) {
      // Adjust the end if it exceeds the document length
      end = document.length;
    }

    // Extract the chunk from the document
    const chunk = document.slice(start, end);
    chunks.push(chunk);

    // Move the start and end positions for the next chunk
    start += overlapSize;
    end = start + chunkSize;
  }

  return chunks;
}

