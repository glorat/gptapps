<template>
  <q-page>
    <multi-file-manager :loading="busy"></multi-file-manager>
    <chat-component :messages="messages"></chat-component>
    <div style="background-color: white; height: 50px"></div>
  </q-page>
  <q-page-sticky position="bottom">
    <q-toolbar class="bg-grey-3 text-black row">
      <q-input rounded outlined dense class="WAL__field q-mr-sm" bg-color="white"
               v-model="newMessage"
               @keydown.enter="sendMessage"
               placeholder="Type your message"/>
      <audio-transcriber @message="onAudioMessage"></audio-transcriber>
      <q-btn disable round flat :icon="true ? matVolumeUp : matVolumeOff"/>
      <q-btn @click="sendMessage" flat class="q-ml-sm" icon="send" color="primary"/>
    </q-toolbar>
  </q-page-sticky>
</template>

<script lang="ts" setup>
import {computed, markRaw, reactive, ref} from 'vue';
import {useMultiFileStore} from 'stores/multiFileStore';
import {matVolumeOff, matVolumeUp} from '@quasar/extras/material-icons';
import {sendChatMessage} from 'src/lib/ai/openaiFacade';
import {getOpenAIChat} from 'src/lib/ai/config';
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {BufferMemory} from 'langchain/memory';
import {v4} from 'uuid';
import MultiFileManager from 'components/MultiFileManager.vue';
import ChatComponent from 'components/ChatComponent.vue';
import AudioTranscriber from "components/AudioTranscriber.vue";
const busy = computed(() => loading.value || multiFileStore.processing)
const loading = ref(false)
const multiFileStore = useMultiFileStore()
const progress = ref(0)
const newMessage = ref('')

const memory = markRaw( new BufferMemory({
  memoryKey: 'chat_history',
  inputKey: 'question',
  outputKey: 'text',
  returnMessages: true
}))

const messages = reactive([] as any[])

//     const progressMessage = {id: v4(), message: progressChunks.join(''), role: 'Other'}

const sendMessage = async () => {
  if (newMessage.value.trim() !== '') {
    const msg = newMessage.value.trim()

    const model = getOpenAIChat()
    const chain = ConversationalRetrievalQAChain.fromLLM(model, multiFileStore.vectorStore.asRetriever(), {
      returnSourceDocuments: true,
      memory,
      questionGeneratorChainOptions:{
        llm: model
      }
    })

    messages.push({id: v4(), message: newMessage.value, role: 'User'})
    const res = await chain.call({question: newMessage.value})
    messages.push({id: v4(), message: res.text, role: 'Other'})

    newMessage.value = ''
  }
}
const onAudioMessage = (msg:string) => {
  newMessage.value = msg
}


</script>

<style scoped>

</style>
