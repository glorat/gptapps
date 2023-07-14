<template>
  <q-page>
    <chat-component :messages="messagesWithProgress"></chat-component>
    <div style="background-color: white; height: 50px"></div>
  </q-page>
  <q-page-sticky position="bottom">
    <chat-entry v-model="newMessage" @message="sendMessage"></chat-entry>
  </q-page-sticky>
</template>

<script setup lang="ts">

import {computed, reactive, ref} from 'vue'
import ChatComponent from 'components/ChatComponent.vue'
import {v4, v4 as uuidv4} from 'uuid'
import {sendChatMessage} from 'src/lib/ai/openaiFacade'
import ChatEntry from 'components/ChatEntry.vue';

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
