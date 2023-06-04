<template>
  <q-page>
    <q-input
      v-model="text"
      filled
      type="textarea"
    />
    <q-separator></q-separator>
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
      />
      <q-btn label="Add Question" @click="addQuestion" />
      <q-btn label="Answer me" @click="doit"></q-btn>
    </div>
    <div>
      <q-input
        v-for="(question, index) in answers"
        :key="index"
        type="textarea"
        v-model="answers[index]"
        :loading="answerLoading[index]"
        outlined
        dense
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {ref, watch, nextTick, onMounted} from 'vue'
import {performQna} from 'src/lib/ai/answer'
import {createQnaStorageFromLargeContent} from 'src/lib/ai/largeDocQna'


const text = ref('')
const questions = ref([] as string[])
const questionInputs = ref([] as HTMLInputElement[]);

const answers = ref([] as string[])
const answerLoading = ref([] as boolean[])

function addQuestion() {
  questions.value.push('')

  nextTick(() => {
    const lastIndex = questions.value.length - 1;
    const newInput = questionInputs.value[lastIndex];

    if (newInput) {
      newInput.focus();
    }
  });
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
  if (localStorage) {
    localStorage.setItem('questions', JSON.stringify(questions.value))
  }

  answers.value =  Array(questions.value.length).fill('')
  answerLoading.value =  Array(questions.value.length).fill(true)

  const storage = await createQnaStorageFromLargeContent(text.value)
  let idx = 0
  for (const question of questions.value) {
    console.log(`QUESTION ${idx}: ${question}`)
    const response = await performQna(question, storage)
    answers.value[idx] = response ?? 'cannot answer'
    answerLoading.value[idx] = false
    console.log(`ANSWER ${idx}: ${response}`)
    console.log()
    idx++
  }
}

</script>
