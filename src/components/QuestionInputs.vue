<template>
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
</template>

<script lang="ts" setup>
import {useQuestionStore} from 'stores/questionStore'
import {computed, nextTick, ref} from 'vue'

const questionStore = useQuestionStore()
const questions = computed(() => questionStore.questions)
const questionInputs = ref([] as HTMLInputElement[])

const props = defineProps({
  loading:Boolean
})


function addQuestion() {
  questionStore.questions.push('')
  nextTick(() => {
    const lastIndex = questionStore.questions.length - 1
    const newInput = questionInputs.value[lastIndex]

    if (newInput) {
      newInput.focus()
    }
  })
}

function removeQuestion(index: number) {
  questionStore.questions.splice(index, 1)
}

</script>

<style scoped>

</style>
