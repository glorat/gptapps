<template>
  <div>
    <q-radio v-model="settings.server" val="openai" label="OpenAI" color="primary" />
    <q-radio v-model="settings.server" val="azure" label="Azure" color="primary" />
    <q-radio v-model="settings.server" val="hosted" label="Hosted" color="primary" />

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
        Obtain an openai key from <a href="https://platform.openai.com/account/api-keys">your openai account</a> and paste below
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
    />
    <q-btn label="Reset" color="secondary" @click="resetSettings" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createEmbedding } from 'src/lib/ai/openaiFacade'
import { Notify } from 'quasar'
import {applyAiUserSettings, Config, getOpenAIAPI} from 'src/lib/ai/config'

const settings = ref({
  server: 'openai',
  azureSettings: { apiKey: '', basePath: '' },
  openaiSettings: { apiKey: '' }
})

const isSavingSettings = ref(false)

onMounted(() => {
  loadSettingsFromLocalStorage()
})

function loadSettingsFromLocalStorage() {
  const savedSettings = localStorage.getItem('aiUserSettings')
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings)
    applyAiUserSettings(settings.value)
  }
}

async function saveSettings() {
  try {
    isSavingSettings.value = true
    applyAiUserSettings(settings.value)
    const res = await getOpenAIAPI().createEmbedding({input:'test', model: Config.embedModel})
    console.log(res)
    localStorage.setItem('aiUserSettings', JSON.stringify(settings.value))
    Notify.create({ type: 'positive', message: 'Settings applied successfully' })
  } catch (e) {
    Notify.create({ type: 'negative', message: 'Invalid settings. Please fix or reset' })
  } finally {
    isSavingSettings.value = false
  }
}

function resetSettings() {
  loadSettingsFromLocalStorage()
}
</script>
