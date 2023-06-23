<template>
  <div>
    <button @click="toggleRecording">
      {{ recording ? 'Stop Recording' : 'Start Recording' }}
    </button>
    <button @click="playRecording" :disabled="!audioUrl">Play Recording</button>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue'
import { createTranscription } from 'src/lib/ai/openaiFacade'

const recording: Ref<boolean> = ref(false);
const mediaRecorder: Ref<MediaRecorder | null> = ref(null);
const audioUrl: Ref<string> = ref('');
const emit = defineEmits(['message'])

const toggleRecording = async () => {
  try {
    if (recording.value && mediaRecorder.value) {
      mediaRecorder.value.stop();
      recording.value = false;
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.value = new MediaRecorder(stream);
      recording.value = true;
      audioUrl.value = '';

      const recordedChunks: Blob[] = [];
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.value.onstop = async () => {
        try {
          const blob = new Blob(recordedChunks, { type: 'audio/wav' });
          const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
          audioUrl.value = URL.createObjectURL(file);
          const text = await createTranscription({ blob });
          emit('message', text);
        } catch (error) {
          console.error('Error during transcription:', error);
        } finally {
          mediaRecorder.value = null;
        }
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
    audioElement.onended = () => {
      audioUrl.value = '';
    };
  }
};
</script>
