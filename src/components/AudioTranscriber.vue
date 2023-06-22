<template>
  <div>
    <button @click="toggleRecording">
      {{ recording ? 'Stop Recording' : 'Start Recording' }}
    </button>
    <button @click="playRecording" :disabled="!audioUrl">Play Recording</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {getOpenAIAPI} from "src/lib/ai/config";

const recording = ref(false);
const mediaRecorder = ref(null);
const audioUrl = ref(null);
const emit = defineEmits(['message'])
const toggleRecording = async () => {
  try {
    if (recording.value) {
      mediaRecorder.value.stop();
      recording.value = false;
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.value = new MediaRecorder(stream);
      recording.value = true;
      audioUrl.value = null;

      const recordedChunks = [];
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.value.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        audioUrl.value = URL.createObjectURL(file);
        const res = await getOpenAIAPI().createTranscription(file, 'whisper-1');
        emit('message', res.data?.text);
        mediaRecorder.value = null
      };

      mediaRecorder.value.start();
    }
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};

const playRecording = () => {
  if (audioUrl.value) {
    const audioElement = new Audio(audioUrl.value);
    audioElement.play();
  }
};
</script>
