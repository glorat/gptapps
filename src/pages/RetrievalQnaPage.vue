<template>
  <q-page>
    <multi-file-manager :loading="busy"></multi-file-manager>
    <chat-component :messages="messages"></chat-component>
    <div style="background-color: white; height: 50px"></div>
  </q-page>
  <q-page-sticky position="bottom">
    <chat-entry v-model="newMessage" @message="sendMessage" @reset="onReset"></chat-entry>
  </q-page-sticky>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import MultiFileManager from 'components/MultiFileManager.vue'
import ChatComponent from 'components/ChatComponent.vue'
import ChatEntry from 'components/ChatEntry.vue'
import {useChatParts} from '../components/chatParts'

const {messages, newMessage, onReset, sendMessage} = useChatParts()

// FIXME: Also source multi-file manager business
const busy = computed(() => loading.value)
const loading = ref(false)
const progress = ref(0)

</script>

<style scoped>

</style>
