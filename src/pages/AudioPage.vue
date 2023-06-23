<template>
  <q-page>
    <audio-transcriber @message="onRecordedMessage"></audio-transcriber>
  </q-page>
</template>

<script setup>
import AudioTranscriber from 'components/AudioTranscriber.vue';
import {answerMe} from 'src/lib/ai/openaiFacade';

async function onRecordedMessage(msg) {
  console.log(msg);
  const res = await answerMe({context: 'You are a helpful AI assistant giving concise responses in one or two sentences. Only use a single language in response.', userPrompt: msg, initPrompt: ''})
  console.log(res)
  speakText(res);
}

import {franc} from 'franc';

const francToBCP47 = {
  cmn: 'zh-CN',
  eng: 'en',
  sco: 'en',
  spa: 'es',
  deu: 'de',
  fra: 'fr',
  jpn: 'ja',
  ita: 'it',
  rus: 'ru',
  kor: 'ko',
};

function speakText(text) {
  const options = {
    only: Object.keys(francToBCP47),
  };

  const detectedLanguage = franc(text, options);
  const langCode = francToBCP47[detectedLanguage];

  if (langCode) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    speechSynthesis.speak(utterance);
  } else {
    console.error('Unsupported language:', detectedLanguage);
  }
}



</script>

<style scoped>

</style>
