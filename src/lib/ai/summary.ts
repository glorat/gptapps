import { chunkDocument } from 'src/lib/ai/chunkDocument';
import { LLMChain } from 'langchain/chains';
import { getOpenAIChat } from 'src/lib/ai/config';
import { PromptTemplate } from 'langchain';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/dist/document';

const MAX_TOKENS_SUMMARY = 1000;

const template = `Write a concise summary of the following:

"{text}"

CONCISE SUMMARY:`;

export const DEFAULT_PROMPT = /*#__PURE__*/ new PromptTemplate({
  template,
  inputVariables: ['text'],
});

export async function summarize(input: string, maxTokens = MAX_TOKENS_SUMMARY): Promise<string> {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 });
  const chunks: Document[] = await splitter.createDocuments([input]);

  const model = getOpenAIChat();

  const summaries = await Promise.all(chunks.map(async (doc, index) => {
    const prompt = DEFAULT_PROMPT;
    const chainA = new LLMChain({ llm: model, prompt });

    console.log(`Begin summarising document #${index}, ${doc.pageContent.length} bytes`);
    // FIXME: Handle case where content filter kicks in
    const res = await chainA.call({
      text: doc.pageContent,
    });

    console.log(`End summarising document #${index}`);
    return res.text as string;
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
