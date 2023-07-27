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
import {computed, onMounted, reactive, ref} from 'vue'
import {useMultiFileStore} from 'stores/multiFileStore';
import {v4} from 'uuid';
import MultiFileManager from 'components/MultiFileManager.vue';
import ChatComponent from 'components/ChatComponent.vue';
import ChatEntry from 'components/ChatEntry.vue';
import {useQnaStore} from '../stores/qnaStore'

const busy = computed(() => loading.value || multiFileStore.processing)
const loading = ref(false)
const multiFileStore = useMultiFileStore()
const progress = ref(0)
const newMessage = ref('')


const messages = computed(() => useQnaStore().messages)

const sendMessage = async () => {
  if (newMessage.value.trim() !== '') {
    const msg = newMessage.value.trim()
    const res = await useQnaStore().performVectorStoreQna({question:msg})
    newMessage.value = ''
  }
}

onMounted(() => {
  useQnaStore().subscribe()
})

const onReset = () => {
  useQnaStore().resetChat()
}

</script>

<style scoped>

</style>
