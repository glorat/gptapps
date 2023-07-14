<template>
  <q-toolbar class="bg-grey-3 text-black row">
    <q-input rounded outlined dense class="WAL__field q-mr-sm" bg-color="white"
             :model-value="modelValue"
             @update:model-value="onModelValueUpdate"
             @keydown.enter="sendMessage"
             placeholder="Type your message"/>
    <audio-transcriber @message="onAudioMessage"></audio-transcriber>
    <q-btn disable round flat :icon="isVolumeOn ? matVolumeUp : matVolumeOff"/>
    <q-btn @click="sendMessage" flat class="q-ml-sm" icon="send" color="primary"/>
  </q-toolbar>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {matVolumeOff, matVolumeUp} from '@quasar/extras/material-icons';
import AudioTranscriber from 'components/AudioTranscriber.vue';

const isVolumeOn = ref(true);
const emit = defineEmits(['message', 'update:modelValue']);

const props = defineProps({
  modelValue: {
    type: String,
  },
});

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
