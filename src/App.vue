<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Notify } from 'quasar'
import {applyAiUserSettings, getSettingsFromLocalStorage} from 'src/lib/ai/config'
import {fbGetApp} from './lib/myfirebase'

onMounted(async () => {
  fbGetApp()
  getSettingsFromLocalStorage()

  const params = new URLSearchParams(window.location.search)
  if (params.has('config')) {
    const configParam = params.get('config')
    try {
      const configJson = decodeURIComponent(configParam)
      applyConfig(configJson)
    } catch (error) {
      handleConfigParsingError(error)
    }
  }
})

function applyConfig(configJson: any) {
  const savedSettings = localStorage.getItem('aiUserSettings')
  if (configJson !== savedSettings) {
    const config = JSON.parse(configJson)
    applyAiUserSettings(config)
    localStorage.setItem('aiUserSettings', configJson)
    Notify.create({
      type: 'info',
      message: 'Parsed config parameter:',
      caption: JSON.stringify(config)
    })
  }
}

function handleConfigParsingError(error: unknown) {
  Notify.create({
    type: 'negative',
    message: 'Failed to parse config parameter:',
    caption: (error as Error).message
  })
}
</script>
