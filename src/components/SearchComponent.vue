<template>
  <chat-entry v-model="newMessage" @message="sendMessage" @reset="onReset"></chat-entry>
  <q-file
    filled
    v-model="uploadedFile"
    label="Upload CSV file"
    accept=".csv"
    @update:model-value="handleFileChange"
  />
  <q-linear-progress v-if="searchProgress" :value="searchProgress"></q-linear-progress>
  <q-table :rows="bulkResults" v-if="bulkResults.length > 0" :columns="bulkCols" wrap-cells="true" @row-click="onBulkRowClick"></q-table>

  <q-table :rows="result" :columns="cols"></q-table>
  <q-btn v-if="result.length > 0" @click="enhanceRelevance">Enhance Relevance</q-btn>
  <!-- show result as cards -->
  <q-card v-for="(res,idx) in result" :key="idx" >
    <q-card-section>Distance: {{ res.score}} File Name {{  res.metadata?.fileName}} Page Number: {{ res.metadata?.pageNumber }} Chunk: {{ res.metadata?.chunkIndex }} Size: {{ res.pageContent.length }} <span v-if="res.relevance">Relevance {{ res.relevance}}</span></q-card-section>
    <q-card-section><pre>{{ res.pageContent }}</pre></q-card-section>
  </q-card>


</template>

<script setup lang="ts">

import ChatEntry from './ChatEntry.vue'
import {ref} from 'vue'
import {similaritySearchWithScore} from '../lib/ai/openaiFacade'
import {fbGetUser} from '../lib/myfirebase'
import {useQnaStoreAsync} from '../stores/qnaStore'
import {qs_relevance, re_0_10_rating} from '../lib/ai/QuestionStatementRelevance'
import {PromptTemplate} from 'langchain/prompts'
import {getOpenAIChat} from '../lib/ai/config'
import {LLMChain} from 'langchain/chains'

const newMessage = ref('')

const result = ref([])

const cols = [
  { name: 'score', label: 'Score', field: 'score', align: 'left' },
  { name: 'header', label: 'Header', field:  (x:any) => x.metadata.header, align: 'left' },
  // { name: 'relevance', label: 'Relevance', field: 'relevance', align: 'left' },
  { name: 'chunkIndex', label: 'Chunk Index', field: (x:any) => x.metadata.chunkIndex, align: 'left' },
  { name: 'pageNumber', label: 'Page Number', field: (x:any) => x.metadata.pageNumber, align: 'left' },
  // { name: 'fileName', label: 'File Name', field: 'metadata.fileName', align: 'left' },
  { name: 'size', label: 'Size', field: (x:any) => x.pageContent.length, align: 'left' },

]

const onReset = () => {
  newMessage.value = ''
}

const sendMessage = async () => {
  const qna = await useQnaStoreAsync()
  const res = await qna.similaritySearchWithScore({query: newMessage.value, k:8})
  result.value = res.map (x => ({score: x[1], ...x[0]}))

  await enhanceRelevance()
  // result.value = res
}

const chunkSummariser = async(statement: string, context: string) => {
  const str = `Your assignment is to determine the article REFERENCE number found in SNIPPET

  Here are guidelines for determining the article number reference:

  - The REFERENCE is found in a section heading, preceded with the word "ARTICLE" or "Article"

  - If you don't know, then REFERENCE is N/A

  - Never elaborate

SNIPPET: {context}

REFERENCE: `
  const prompt = PromptTemplate.fromTemplate(str)
  const model = getOpenAIChat()
  const chain = new LLMChain({ llm: model, prompt })
  const res = await chain.call({statement, context})
  return re_0_10_rating(res.text, 0)
}

const enhanceRelevance = async() => {
  const recs = result.value
  await Promise.all(recs.map(async rec => {
    // rec.relevance = await qs_relevance(newMessage.value, rec.pageContent)
    // rec.article = await chunkSummariser(newMessage.value, rec.pageContent)
    return rec
  }))
  result.value = recs
}

import Papa from 'papaparse'
import {omit} from 'lodash'
const uploadedFile = ref<File | null>(null);
const searchProgress = ref(0)
const bulkResults = ref([])
const bulkCols = ref([])
const mySearchColNames = ['header', 'score', 'context']

async function handleFileChange() {
  if (uploadedFile.value) {
    try {
      const qna = await useQnaStoreAsync()
      const records = await parseCSVFromFile(uploadedFile.value);
      let progress = 0
      const recordsWithResult = await Promise.all(records.data.map(async rec => {
        const query = JSON.stringify(rec)
        const reses = await qna.similaritySearchWithScore({query, k:1})
        progress += 1
        searchProgress.value = progress / records.data.length
        console.log(`searchProgress ${searchProgress.value}`)
        const res = reses[0]
        const score = res[1]
        const context = res[0].pageContent
        const header = res[0].metadata.header
        return {...rec, score, context, header}
      }))
      console.log(recordsWithResult);
      bulkResults.value = recordsWithResult
      const bulkColsNames = [
        ...records.meta.fields.filter((f:string) => !f.startsWith('_')),
        ...mySearchColNames,
      ]
      bulkCols.value = bulkColsNames.map(f => ({name: f, label: f, field: f, align: 'left'}))
      bulkResults.value = recordsWithResult

      // Do something with the records here
    } catch (error) {
      console.error('Error parsing the file:', error);
    }
  }
}
const onBulkRowClick = (ev:any, row:any) => {
  const query = omit(row, mySearchColNames)
  newMessage.value = JSON.stringify(query)
  sendMessage()
}

async function parseCSVFromFile(file: File) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}


</script>

<style scoped>

</style>
