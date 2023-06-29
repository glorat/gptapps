<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import {marked} from 'marked';
import {computed, onMounted, ref, watch} from 'vue';

const props = defineProps(['page'])

const content = ref('Loading...')

const rendered = computed(() => marked(content.value))

onMounted(() => {
  loadPage(props.page)
})


const loadPage = async (page: string) => {
  const resolvedPage = page.endsWith('.md') ? page : `${page}.md` // Auto append .md
  try {
    const response = await axios.get('/md/' + resolvedPage)
    content.value = response.data
  } catch (error:any) {
    content.value = resolvedPage + ':' + error?.message
  }
}

watch(() => props.page, (val: string) => {
  loadPage(val);
})


</script>

<style scoped>

</style>
