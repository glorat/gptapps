<template>
  <q-page>
    <div class="row">
      <div class="col-sm-6 col-xs-12 full-height">
        <q-input
          v-model="text"
          filled
          type="textarea"
          :disable="loading"
          autogrow
          label="Content to query - paste here"
        />
        <q-file
          v-model="file"
          label="Drop any file here or click to upload"
          filled
          @update:model-value="onFileUpload"
        >
          <template v-slot:before>
            <q-icon :name="matCloudUpload" />
          </template>
        </q-file>
      </div>
      <div class="col">
        <div>
          <question-inputs></question-inputs>
          <q-btn label="Answer me" @click="doit" :disable="loading"></q-btn>
          <q-btn label="Download CSV" @click="generateCSV" :disable="loading || questions.length === 0 || questions.length !== answers.length "></q-btn>
        </div>
        <q-linear-progress v-if="embedProgress" :value="embedProgress"></q-linear-progress>
        <div>
          <q-input
            v-for="(answer, index) in answers"
            :key="index"
            type="textarea"
            v-model="answers[index]"
            :loading="answerLoading[index]"
            outlined
            dense
            readonly
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {ref, nextTick, onMounted, Ref, computed, watch} from 'vue'
import {performQna2} from 'src/lib/ai/answer'
import {createVectorStoreFromLargeContent} from 'src/lib/ai/largeDocQna'
import {exportFile, Notify} from 'quasar'
import {matCloudUpload} from '@quasar/extras/material-icons'
import axios from 'axios'
import {fileToPartitions, fileToText} from 'src/lib/ai/unstructured'
import {useQuestionStore} from 'stores/questionStore'
import QuestionInputs from 'components/QuestionInputs.vue'
import {useMultiFileStoreBrowser} from '../stores/multiFileStore'

const text = ref('')
const questions = computed(() => questionStore.questions)

const answers = ref([] as string[])
const answerLoading = ref([] as boolean[])

const embedProgress = ref(0.0)
const loading = ref(false)

const questionStore = useQuestionStore()

// Load questions from localStorage on component mount
onMounted(() => {
  // const savedQuestions = localStorage?.getItem('questions')
  // if (savedQuestions) {
  //   questionStore.questions = JSON.parse(savedQuestions)
  // }
})

const storeText = computed (() => {
  return useMultiFileStoreBrowser().allText
})

watch(storeText, (txt) => {
  text.value = txt
})

async function doit() {
  try {
    loading.value = true
    questionStore.saveQuestions()

    answers.value = Array(questionStore.questions.length).fill('')
    answerLoading.value = Array(questionStore.questions.length).fill(true)

    const vectorStore = await createVectorStoreFromLargeContent(text.value, (p)=>embedProgress.value=p)

    let idx = 0
    for (const question of questionStore.questions) {
      console.log(`QUESTION ${idx}: ${question}`)
      const response = await performQna2(question, vectorStore)
      answers.value[idx] = response ?? 'cannot answer'
      answerLoading.value[idx] = false
      console.log(`ANSWER ${idx}: ${response}`)
      console.log()
      idx++
    }
  } catch (e) {
    Notify.create({ message: e?.toString() ?? 'Unknown error' })
  } finally {
    loading.value = false
  }
}

function escapeCSVValue(value: string): string {
  // Escape double quotes by doubling them
  const escapedValue = value.replace(/"/g, '""')

  // Enclose the value in double quotes if it contains a comma or a double quote
  if (value.includes(',') || value.includes('"')) {
    return `"${escapedValue}"`
  }

  return escapedValue
}

function generateCSV() {
  const csvRows = [
    ['id', 'question', 'answer'], // header row
  ]

  questionStore.questions.forEach((question, index) => {
    const id = index + 1 // generate a unique id for each question
    const answer = answers.value[index]
    const escapedQuestion = escapeCSVValue(question)
    const escapedAnswer = escapeCSVValue(answer)
    csvRows.push([id, escapedQuestion, escapedAnswer])
  })

  const csvContent = csvRows.map(row => row.join(',')).join('\n')

  // Download the CSV file using Quasar's exportFile method
  exportFile('questions_answers.csv', csvContent, 'text/csv')
}

const file: Ref<File|undefined> = ref(undefined)
async function onFileUpload() {
  try {
    if (file.value) {
      text.value = await fileToText(file.value)
    }
    // console.log(response.data);
    // debugger
  } catch (error) {
    console.error(error);
  }
}
</script>
