<template>
  <q-page>
    <chat-component :messages="messagesWithProgress"></chat-component>
    <div style="background-color: white; height: 50px"></div>
  </q-page>
  <q-page-sticky position="bottom">
    <q-toolbar class="bg-grey-3 text-black row">
      <q-input rounded outlined dense class="WAL__field q-mr-sm" bg-color="white"
               v-model="newMessage"
               @keydown.enter="sendMessage"
               placeholder="Type your message"/>
      <q-btn disable round flat :icon="matMic"/>
      <q-btn disable round flat :icon="true ? matVolumeUp : matVolumeOff"/>
      <q-btn @click="sendMessage" flat class="q-ml-sm" icon="send" color="primary"/>
    </q-toolbar>
  </q-page-sticky>
</template>

<script setup lang="ts">

import {computed, ComputedRef, reactive, ref} from 'vue'
import ChatComponent from 'components/ChatComponent.vue'
import ChatGPTClient from 'src/lib/ai/ChatGPTClient'
import {getOpenAIAPI, OpenAIParams} from 'src/lib/ai/config'
import {v4, v4 as uuidv4} from 'uuid'
import {matMic, matVolumeOff, matVolumeUp} from '@quasar/extras/material-icons'
import {sendChatMessage} from 'src/lib/ai/openaiFacade'

const cache = reactive({})
const getCache = async(id:string):Promise<any> => cache[id]
const setCache = async(id:string, value:any):Promise<void> => {
  // console.log(`setting cache ${id} to `, value)
  cache[id] = value
  return
}
const convCache = {get:getCache, set:setCache}

const currentConversation = ref('')


const newMessage = ref('')
const messages = computed(() => {
  return cache[currentConversation.value]?.messages
})

const messagesWithProgress = computed(() => {
  let ret = messages.value ?? []
  if (progressChunks && progressChunks.length) {
    // const sendMessage = {id:'', message: newMessage.value, role: 'User'}
    const progressMessage = {id: v4(), message: progressChunks.join(''), role: 'Other'}
    return [...ret, progressMessage]
  } else {
    return ret
  }
})


const progressChunks = reactive([] as string[])

const convMessageOptions = () => {
  const onProgress = (x:string) => {
    progressChunks.push(x)
  }

  if (messages.value) {
    const lastMsg = messages.value[messages.value.length-1]
    return {parentMessageId:lastMsg?.id, conversationId: currentConversation.value, onProgress}
  } else {
    const conversationId = uuidv4()
    currentConversation.value = conversationId
    return {onProgress, conversationId: conversationId}
  }

}

const sendMessage = async () => {
  if (newMessage.value.trim() !== '') {
    const msg = newMessage.value.trim()
    console.log('New Message:', msg)

    const options = convMessageOptions()
    const res = await sendChatMessage({message: msg, chatOptions:options, cache: convCache})

    currentConversation.value = res.conversationId
    progressChunks.length = 0
    newMessage.value = ''
  }
}

</script>

<style scoped>

</style>
