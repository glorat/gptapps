<template>
  <q-page>
    <create-image-request-editor v-model="request"></create-image-request-editor>
    <q-btn
      label="Generate"
      color="primary"
      @click="generate"
      :disable="loading"
    ></q-btn>

    <div v-if="data.length">
      <div v-for="(item, idx) in data" :key="idx">
        <q-img v-if="item.url" :src="item.url" :width="imgSize" :height="imgSize" :alt="item.revised_prompt"></q-img>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { getOpenAIAPI } from 'src/lib/ai/config';
import CreateImageRequestEditor from 'components/CreateImageRequestEditor.vue';
import { ref } from 'vue';
import {createImage} from 'src/lib/ai/openaiFacade';

const request = ref({});
const data = ref([]);
const imgSize = ref('256px'); // Hardcoded for now
const loading = ref(false); // Flag to track the loading state

async function generate() {
  loading.value = true; // Set loading to true when generating
  try {
    const resdata = await createImage({request: request.value})
    console.log(resdata);
    if (resdata.created) {
      data.value = resdata.data;
    }
  } catch (error) {
    console.error('Error generating image:', error);
    // Handle the error here (e.g., display an error message)
  } finally {
    loading.value = false; // Set loading to false when generation is complete or when an error occurs
  }
}
</script>

<style scoped>
/* Add any necessary styling here */
</style>
