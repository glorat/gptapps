<template>
  <q-input
    v-model="questionText"
    outlined
    dense
    clearable
    textarea
    autogrow
    @update:model-value="updateQuestions"
    ref="questionInput"
    :disable="loading"
    label="Questions"
    :placeholder="placeholder"
  />
</template>

<script lang="ts" setup>
import {useQuestionStore} from '../stores/questionStore'
import {computed, ref} from 'vue'

const questionStore = useQuestionStore()
const questionText = ref(questionStore.questions.join('\n'))
const placeholder = "Enter your list of questions here\none line each\nas many as you like"

const props = defineProps({
  loading:Boolean
})

// Update the questions array whenever the text area input changes
function updateQuestions() {
  questionStore.questions = questionText.value.split('\n').filter(q => q.trim() !== '');
}
</script>
