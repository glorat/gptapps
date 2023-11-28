<template>
  <q-linear-progress v-if="loading" :value="progress"></q-linear-progress>
  <div class="row" v-if="rows.length > 0">
    <q-table :rows="rows" :columns="columns" wrap-cells></q-table>
  </div>
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
<!--      <q-file-->
<!--        v-model="file"-->
<!--        label="Drop any file here or click to upload"-->
<!--        filled-->
<!--        @update:model-value="onFileUpload"-->
<!--      >-->
<!--        <template v-slot:before>-->
<!--          <q-icon :name="matCloudUpload" />-->
<!--        </template>-->
<!--      </q-file>-->
    </div>
    <div class="col">
      <div>
        <question-inputs></question-inputs>
        <q-btn label="Answer me" @click="doit" :disable="loading"></q-btn>
      </div>
    </div>
  </div>

</template>
<script setup lang="ts">

import {computed, onMounted, Ref, ref, watch} from 'vue'
import {createVectorStoreFromLargeContent} from '../lib/ai/largeDocQna'
import {exportFile, Notify} from 'quasar'
import {matCloudUpload} from '@quasar/extras/material-icons'
import {fileToText} from '../lib/ai/unstructured'
import {useQuestionStore} from '../stores/questionStore'
import QuestionInputs from 'components/QuestionInputs.vue'
import {useMultiFileLocalStore} from '../stores/multiFileLocalStore'
import {listQuery, performQna} from '../lib/ai/answer'

const text = ref('')
const questionStore = useQuestionStore()
const questions = computed(() => questionStore.questions)
const progress = ref(0.0)
const loading = ref(false)
const rows = ref([])
const columns = ref([])

const initPrompt = `Answer the question as truthfully as possible using the provided text.
If the answer is not contained within the text, say \"I don't know\"
Reply concisely. Sentences not required. For example

Question: What is the capital of France?
Context: Paris is the capital of France
Answer: Paris

`


async function doit() {
  const contexts = text.value.split('\n').filter(q => q.trim() !== '')
  if (contexts.length > 0) {
    try {
      loading.value = true
      questionStore.saveQuestions()
      const {fields, rows: rs} = await listQuery({contexts, questions: questions.value, initPrompt, progress: p => progress.value = p})
      rows.value = rs

      // format function trims extra-long text with a ... suffix
      const format = (str:string) => (str.length && str.length > 100) ?  str.substring(0, 100) + '...' : str

      // construct columns
      columns.value = [
        {name: 'context', label: 'Context', field: 'context', format, align:'left'},
      ]

      fields.forEach((field) => {
        columns.value.push({name: field, label: field, field: field, format, align:'left'});
      });

    } catch (e) {
      Notify.create({message: e?.toString() ?? 'Unknown error'})
    } finally {
      loading.value = false
    }
  }
}

</script>

<style scoped>

</style>
