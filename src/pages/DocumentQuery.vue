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
      </div>
      <div class="col">
        <div>
          <q-input
            v-for="(question, index) in questions"
            :key="index"
            v-model="questions[index]"
            outlined
            dense
            clearable
            @clear="removeQuestion(index)"
            @keydown.enter="addQuestion"
            ref="questionInputs"
            :disable="loading"
          />
          <q-btn label="Add Question" @click="addQuestion" :disable="loading"/>
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
import { ref, watch, nextTick, onMounted } from 'vue'
import {performQna, performQna2} from 'src/lib/ai/answer'
import {createQnaStorageFromLargeContent, createVectorStoreFromLargeContent} from 'src/lib/ai/largeDocQna'
import {exportFile, Notify} from 'quasar'

const text = ref('')
const questions = ref([] as string[])
const questionInputs = ref([] as HTMLInputElement[])

const answers = ref([] as string[])
const answerLoading = ref([] as boolean[])

const embedProgress = ref(0.0)
const loading = ref(false)

function addQuestion() {
  questions.value.push('')

  nextTick(() => {
    const lastIndex = questions.value.length - 1
    const newInput = questionInputs.value[lastIndex]

    if (newInput) {
      newInput.focus()
    }
  })
}

function removeQuestion(index: number) {
  questions.value.splice(index, 1)
}

// Load questions from localStorage on component mount
onMounted(() => {
  const savedQuestions = localStorage?.getItem('questions')
  if (savedQuestions) {
    questions.value = JSON.parse(savedQuestions)
  }
})

async function doit() {
  try {
    loading.value = true
    if (localStorage) {
      localStorage.setItem('questions', JSON.stringify(questions.value))
    }

    answers.value = Array(questions.value.length).fill('')
    answerLoading.value = Array(questions.value.length).fill(true)

    const vectorStore = await createVectorStoreFromLargeContent(text.value, (p)=>embedProgress.value=p)

    let idx = 0
    for (const question of questions.value) {
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

  questions.value.forEach((question, index) => {
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
</script>
