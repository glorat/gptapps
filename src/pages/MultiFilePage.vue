<template>
  <multi-file-manager :loading="busy"></multi-file-manager>
  <question-inputs :loading="busy"></question-inputs>
  <q-btn label="Answer me" color="primary" @click="doit" :disable="busy"></q-btn>
  <q-linear-progress v-if="progress" :value="progress"></q-linear-progress>

</template>

<script lang="ts" setup>
import MultiFileManager from 'components/MultiFileManager.vue'
import QuestionInputs from 'components/QuestionInputs.vue'
import {computed, onMounted, ref} from 'vue'
import {exportFile, Notify} from 'quasar'
import {useMultiFileStoreAsync} from '../stores/multiFileStore'
import {performQna} from '../lib/ai/answer'
import {useQuestionStore} from '../stores/questionStore'

const multiFileStoreRef = ref(undefined)
const busy = computed(() => loading.value || multiFileStoreRef.value?.processing)
const loading = ref(false)
const questionStore = useQuestionStore()

const progress = ref(0)

onMounted(async() => {
  multiFileStoreRef.value = await useMultiFileStoreAsync()
})

async function doit() {
  const multiFileStore = await useMultiFileStoreAsync()
  try {
    loading.value = true
    const answers: string[][] = []

    let idx = 0
    let count = 0
    const total = questionStore.questions.length * multiFileStore.documentInfo.length
    for (const question of questionStore.questions) {
      answers[idx] = Array(questionStore.questions.length).fill('')
      for (const [fileIdx, file] of multiFileStore.documentInfo.entries()) {
        console.log(`QUESTION ${idx}: ${question}`)
        const vectorStore = multiFileStore.getVectorStore()
        const response = await performQna({strategy:'default', question, vectorStore, filter: d=>d.metadata['fileName'] === file.file.name})
        answers[idx][fileIdx] = response.answer ?? 'cannot answer'
        console.log(`ANSWER ${idx}: ${response.answer}`)
        console.log()
        count += 1
        progress.value = (count / total )

      }
      idx++
    }
    generateCSV(answers)
  } catch (e) {
    Notify.create({message: e?.toString() ?? 'Unknown error'})
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

async function generateCSV(answers:string[][]) {
  const multiFileStore = await useMultiFileStoreAsync()
  const csvRows = [
    ['id', 'question', ...multiFileStore.documentInfo.map(x=>x.file.name)], // header row
  ]

  questionStore.questions.forEach((question, index) => {
    const id = index + 1 // generate a unique id for each question
    const answer = answers[index].map(escapeCSVValue)
    const escapedQuestion = escapeCSVValue(question)
    csvRows.push([id.toString(), escapedQuestion, ...answer])
  })

  const csvContent = csvRows.map(row => row.join(',')).join('\n')

  // Download the CSV file using Quasar's exportFile method
  exportFile('multi_questions_answers.csv', csvContent, 'text/csv')
}


</script>

<style scoped>

</style>
