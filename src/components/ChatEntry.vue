<template>
  <div style="background-color: lightgrey">
    <q-input rounded outlined dense autogrow class="q-mr-sm" bg-color="white"
             :model-value="modelValue"
             @update:model-value="onModelValueUpdate"
             @keydown.enter="sendMessage"
             placeholder="Type your message"
    >
      <template v-slot:before>
        <q-btn @click="onReset" flat class="q-ml-sm" icon="refresh" color="primary"/>
      </template>
      <template v-slot:append>
        <audio-transcriber @message="onAudioMessage"></audio-transcriber>
        <q-btn disable round flat :icon="isVolumeOn ? matVolumeUp : matVolumeOff"/>
        <q-btn @click="sendMessage" flat class="q-ml-sm" icon="send" color="primary"/>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {matVolumeOff, matVolumeUp} from '@quasar/extras/material-icons';
import AudioTranscriber from 'components/AudioTranscriber.vue';

const isVolumeOn = ref(true);
const emit = defineEmits(['message', 'update:modelValue', 'reset']);

defineProps({
  modelValue: {
    type: String,
  },
});

const onReset = () => {
  emit('reset')
}

const sendMessage = async () => {
  emit('message');
};

const onAudioMessage = (msg: string) => {
  emit('update:modelValue', msg)
};

const onModelValueUpdate = (msg:string) => {
  emit('update:modelValue', msg)
}
</script>

<style scoped>
/* Component styles */
</style>
