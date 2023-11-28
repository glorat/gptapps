// Chat component code
import {computed, onMounted, ref} from 'vue'
import {useQnaStoreAsync} from '../stores/qnaStore'
// import {fbGetUser} from '../lib/myfirebase'

export const useChatParts = () => {

  const qnaStore = ref(undefined)
  const messages = computed(() => qnaStore.value?.messages ?? [])
  const newMessage = ref('')
  const sendMessage = async () => {
    if (newMessage.value.trim() !== '') {
      const msg = newMessage.value.trim()
      const res = qnaStore.value.performVectorStoreQna({question: msg})
      newMessage.value = ''
    }
  }
  const onReset = () => {
    qnaStore.value.resetChat()
  }

  onMounted(async () => {
    // await fbGetUser()
    qnaStore.value = await useQnaStoreAsync()
    await qnaStore.value.subscribe()
  })

  return {messages, newMessage, sendMessage, onReset}
}
