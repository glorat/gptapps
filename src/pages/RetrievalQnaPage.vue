<template>
  <q-page>
    <multi-file-manager :loading="busy"></multi-file-manager>
    <chat-component :messages="messages"></chat-component>
    <div style="background-color: white; height: 50px"></div>
  </q-page>
  <q-page-sticky position="bottom">
    <chat-entry v-model="newMessage" @message="sendMessage"></chat-entry>
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
import ChatEntry from "components/ChatEntry.vue";
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


</script>

<style scoped>

</style>
