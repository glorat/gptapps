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
        <q-btn @click="doit" color="primary" label="Summarise" :disable="loading"></q-btn>
        <q-input type="textarea" autogrow v-model="answer" :disable="loading"></q-input>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {computed, onMounted, Ref, ref} from 'vue'
import {Notify} from 'quasar'
import {matCloudUpload} from '@quasar/extras/material-icons'
import {fileToText} from 'src/lib/ai/unstructured'
import {useQuestionStore} from 'stores/questionStore'
import {loadSummarizationChain} from 'langchain/chains';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {getOpenAIChat} from '../lib/ai/config';
import {performSummarisation} from "src/lib/ai/answer";

const text = ref('')
const questions = computed(() => questionStore.questions)

const answer = ref('')

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

async function doit() {
  try {
    answer.value = await performSummarisation(text.value)
  } catch (e) {
    Notify.create({ message: e?.toString() ?? 'Unknown error' })
  } finally {
    loading.value = false
  }
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
