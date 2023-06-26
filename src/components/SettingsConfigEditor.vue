<template>
  <div>
    <q-radio v-model="settings.server" val="openai" label="OpenAI" color="primary"/>
    <q-radio v-model="settings.server" val="azure" label="Azure" color="primary"/>
    <q-radio v-model="settings.server" val="hosted" label="Hosted" color="primary"/>

    <q-card v-if="settings.server === 'azure'">
      <q-card-section>
        Obtain parameters from your system administrator and input below
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="settings.azureSettings.apiKey"
          label="Azure API Key"
          filled
        ></q-input>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="settings.azureSettings.basePath"
          label="Azure Base Path"
          filled
        ></q-input>
      </q-card-section>
    </q-card>

    <q-card v-else-if="settings.server === 'hosted'">
      <q-card-section>
        <p>This feature is still under construction.</p>
      </q-card-section>
    </q-card>

    <q-card v-else>
      <q-card-section>
        Obtain an OpenAI key from
        <a href="https://platform.openai.com/account/api-keys">your OpenAI account</a>
        and paste below
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="settings.openaiSettings.apiKey"
          label="OpenAI API Key"
          filled
        ></q-input>
      </q-card-section>
    </q-card>

    <q-btn
      label="Save Settings"
      color="primary"
      @click="saveSettings"
      :disable="isSavingSettings"
      :icon="matSave"
    />
    <q-btn label="Reset" color="secondary" @click="resetSettings" :icon="matRefresh"/>
    <q-btn
      label="Share Settings"
      color="primary"
      :icon="matShare"
      @click="shareSettings"
    />
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {createEmbedding} from 'src/lib/ai/openaiFacade'
import {Dialog, Notify, useQuasar} from 'quasar'
import {applyAiUserSettings, Config, getOpenAIAPI, getSettingsFromLocalStorage} from 'src/lib/ai/config'
import {matRefresh, matSave, matShare} from "@quasar/extras/material-icons";

const settings = ref({
  server: 'openai',
  azureSettings: {apiKey: '', basePath: ''},
  openaiSettings: {apiKey: ''}
})

const isSavingSettings = ref(false)

onMounted(() => {
  loadSettingsFromLocalStorage()
})

function loadSettingsFromLocalStorage() {
  const savedSettings = getSettingsFromLocalStorage()
  if (savedSettings) {
    settings.value = savedSettings
  }
}

async function saveSettings() {
  try {
    isSavingSettings.value = true
    applyAiUserSettings(settings.value)
    // TODO: When hosted works, replace this with API call but without retries
    const res = await getOpenAIAPI(Config.embedModel).createEmbedding({input: 'test', model: Config.embedModel})
    console.log(res)
    localStorage.setItem('aiUserSettings', JSON.stringify(settings.value))
    Notify.create({type: 'positive', message: 'Settings applied successfully'})
  } catch (e) {
    Notify.create({type: 'negative', message: 'Invalid settings. Please fix or reset'})
  } finally {
    isSavingSettings.value = false
  }
}

function resetSettings() {
  loadSettingsFromLocalStorage()
}

async function copyUrlToClipboard() {
  try {
    const baseURL = window.location.origin
    const configParam = encodeURIComponent(JSON.stringify(settings.value))
    const url = new URL(baseURL)
    url.searchParams.append('config', configParam)
    const urlToCopy = url.href

    await navigator.clipboard.writeText(urlToCopy)
    Notify.create({
      type: 'positive',
      message: 'URL copied to clipboard',
      timeout: 2000
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to copy URL to clipboard',
      timeout: 2000
    })
  }
}

function shareSettings() {
  Dialog.create({
    title: 'Warning',
    message: 'Sharing your settings may expose sensitive information. Proceed with caution.',
    persistent: true,
    ok: 'Proceed',
    cancel: 'Cancel'
  }).onOk(copyUrlToClipboard)
}
</script>
