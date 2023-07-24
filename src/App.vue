<template>
  <router-view
  ></router-view>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {Notify, Loading, QSpinnerBox} from 'quasar'
import {applyAiUserSettings, getSettingsFromLocalStorage} from 'src/lib/ai/config'
import {fbGetApp} from './lib/myfirebase'
import {useMultiFileStore} from './stores/multiFileStore'

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

const isDraggingOver = ref(false);
const isDraggingFiles = ref(false);
// const isDropAccepted = ref(false);
// const isDropRejected = ref(false);
const dragSourceCounter = ref(0); // Track active drag sources
const handleDragEnter = (event) => {
  event.preventDefault();
  isDraggingFiles.value = true;
  if (dragSourceCounter.value === 0) {
    Loading.show({
      spinner: QSpinnerBox ,
      backgroundColor: 'grey',
      message: 'drop any files here'
    })
  }
  dragSourceCounter.value++;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  dragSourceCounter.value--;

  // Check if all drag sources have left before triggering the effect
  if (dragSourceCounter.value === 0) {
    isDraggingFiles.value = false;
    isDraggingOver.value = false;
    Loading.hide()
  }
};

const handleDrop = async (event) => {
  event.preventDefault();
  isDraggingOver.value = false;
  isDraggingFiles.value = false;
  dragSourceCounter.value = 0; // Reset the drag source counter
  Loading.hide()

  await uploadFiles(event.dataTransfer?.files);
};
const handleDragOver = (event) => {
  event.preventDefault();
  isDraggingOver.value = true;
};

const uploadFiles = async (files) => {
  if (files && files.length) {
    const store = useMultiFileStore()
    const ps = Array.from(files).map((file: File) =>
      store.addFile(file)
    )
    await Promise.all(ps)
    await store.processNextDocument()
  }
}
onMounted(() => {
  // Attach the event listeners to the window
  window.addEventListener('dragover', handleDragOver);
  window.addEventListener('dragenter', handleDragEnter);
  window.addEventListener('dragleave', handleDragLeave);
  window.addEventListener('drop', handleDrop);
});

onBeforeUnmount(() => {
  // Remove the event listeners when the component is unmounted
  window.removeEventListener('dragover', handleDragOver);
  window.removeEventListener('dragenter', handleDragEnter);
  window.removeEventListener('dragleave', handleDragLeave);
  window.removeEventListener('drop', handleDrop);
});

</script>

<style>
</style>
