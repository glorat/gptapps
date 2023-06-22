<template>
  <q-page>
    <audio-transcriber @message="onRecordedMessage"></audio-transcriber>
  </q-page>
</template>

<script setup>
import AudioTranscriber from "components/AudioTranscriber.vue";
import {answerMe} from "src/lib/ai/openaiFacade";

async function onRecordedMessage(msg) {
  console.log(msg);
  const res = await answerMe({context: 'You are a helpful AI assistant giving concise responses in one or two sentences', userPrompt: msg, initPrompt: ''})
  console.log(res)
  speakText(res);
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

</script>

<style scoped>

</style>
