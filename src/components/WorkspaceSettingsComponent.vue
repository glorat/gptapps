<template>
  <pre>{{ JSON.stringify(workspaceInfo) }}</pre>
  <div class="q-mb-md">
    <q-input filled v-model="input.name" label="Name" placeholder="Name your GPT" />
  </div>
  <div class="q-mb-md">
    <q-input filled v-model="input.description" type="text" label="Description" placeholder="Add a short description about what this GPT does" />
  </div>
  <div class="q-mb-md">
    <q-input filled v-model="input.instructions" type="textarea" label="Instructions" placeholder="What does this GPT do? How does it behave? What should it avoid doing?" />
  </div>
  <div class="q-mb-md">
    <q-btn color="primary" label="Save" @click="onSave" />
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {fbGetUser} from '../lib/myfirebase'
import {useMultiFileStoreAsync} from '../stores/multiFileStore'

interface MyInput {
  name: string
  description: string
  instructions: string
}

const input = reactive({name:'', description:'', instructions:''} as MyInput)

const workspaceInfo = computed(() => {
  const store = multiFileStore.value
  return store?.currentWorkspaceInfo
})

const multiFileStore = ref(undefined)
onMounted(async () => {
  await fbGetUser()
  multiFileStore.value = await useMultiFileStoreAsync()
  // await multiFileStore.value.subscribe()
})

const onSave = async() => {
  multiFileStore.value.updateWorkspace(input)
}

const onReset = () => {
  input.name = workspaceInfo.value?.name ?? ''
  input.description = workspaceInfo.value?.description ?? ''
  input.instructions = workspaceInfo.value?.instructions ?? ''
}

watch(workspaceInfo, () => {
  onReset()
})

</script>
