<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          GPT Apps
        </q-toolbar-title>

        <div><q-input label="Open AI Endpoint" type="text" filled v-model="apiUrl" @update:model-value="onApiUrlChange"></q-input></div>
        <div><q-input label="Open AI Key" type="password" filled v-model="openaikey" @update:model-value="onKeyChange"></q-input></div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <my-aside></my-aside>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import MyAside from 'layouts/MyAside.vue'
import {Config, OpenAIParams} from 'src/lib/ai/config'

const leftDrawerOpen = ref(false)

const openaikey = ref('')
const apiUrl = ref('')

onMounted(() => {
  const key = localStorage?.getItem('openaikey')
  if (key) {
    openaikey.value = key
    OpenAIParams.apiKey = key
  }
  const url = localStorage?.getItem('apiUrl')
  if (url) {
    apiUrl.value = url
    OpenAIParams.basePath = url
  }
})
function onKeyChange() {
  localStorage?.setItem('openaikey', openaikey.value)
  OpenAIParams.apiKey = openaikey.value
}
function onApiUrlChange() {
  localStorage?.setItem('apiUrl', apiUrl.value)
  OpenAIParams.basePath = apiUrl.value
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
