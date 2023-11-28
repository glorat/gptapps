import { LLMChain } from 'langchain/chains';
import { getOpenAIChat } from './config';
import { PromptTemplate } from 'langchain/prompts';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/dist/document';
import {round} from 'lodash';

const MAX_TOKENS_SUMMARY = 1000;

const template = `Write a concise summary of the following, using about half the words as the original while retaining the original meaning:

"{text}"

CONCISE SUMMARY:`;

export const DEFAULT_PROMPT = /*#__PURE__*/ new PromptTemplate({
  template,
  inputVariables: ['text'],
});

export async function summarize(input: string, maxTokens = MAX_TOKENS_SUMMARY): Promise<string> {
  if (input.length === 0) return input
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 });
  const chunks: Document[] = await splitter.createDocuments([input]);

  const model = getOpenAIChat();

  const summaries = await Promise.all(chunks.map(async (doc, index) => {
    const prompt = DEFAULT_PROMPT;
    const chainA = new LLMChain({ llm: model, prompt });

    console.log(`Begin summarising document #${index}, ${doc.pageContent.length} chars`);
    // FIXME: Handle case where content filter kicks in
    const res = await chainA.call({
      text: doc.pageContent,
    });
    const smaller = res.text as string
    const perc = round(100*smaller.length/doc.pageContent.length)

    console.log(`End summarising document #${index} by ${perc}% to ${smaller.length} chars`);
    return smaller as string;
  }));

  const summary = summaries.join('\n');

  const sumTokens = await model.getNumTokens(summary);

  if (sumTokens > maxTokens) {
    console.log(`Recursively calling summarize for ${sumTokens} tokens`);
    return summarize(summary);
  } else {
    console.log(`Recursion complete with ${sumTokens} tokens`);
    return summary;
  }
}
