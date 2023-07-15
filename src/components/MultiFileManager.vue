<template>
  <div>
    <q-file
      v-model="files"
      multiple
      filled
      color="teal"
      @update:model-value="onFileChange"
      drag-and-drop
      :loading="loading"
      label="Drag and drop multiple files to question here"
    >
      <template v-slot:prepend>
        <q-icon :icon="matCloudUpload" />
      </template>
    </q-file>

    <q-table
      v-if="uploadedFiles.length>0"
      :loading="processingDocuments"
      :rows="uploadedFiles"
      row-key="file.name"
      :columns="columns"
      row-class="row-styling"
      no-data-label="No files uploaded yet"
    ></q-table>
  </div>
</template>

<script setup lang="ts">
import {computed, markRaw, ref} from 'vue'
import {createVectorStoreFromLargeContent} from 'src/lib/ai/largeDocQna'
import {fileToText} from 'src/lib/ai/unstructured'
import {DocumentInfo, useMultiFileStore} from 'stores/multiFileStore'
import {matCloudUpload} from '@quasar/extras/material-icons'
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";

defineProps({
  loading:Boolean
})

const files = ref<File[]>([]);
const multiFileStore = useMultiFileStore()
const uploadedFiles = computed(() => multiFileStore.documentInfo)
const columns = [
  {
    name: 'File Name',
    required: true,
    align: 'left',
    field: (row: DocumentInfo) => row.file.name,
    label: 'Name',
    sortable: true,
  },
  {
    name: 'Size (bytes)',
    align: 'left',
    field: (row: DocumentInfo) => row.file.size,
    label: 'Size',
    sortable: true,
  },
  {
    name: 'Type',
    align: 'left',
    field: (row: DocumentInfo) => row.file.type,
    label: 'Type',
    sortable: true,
  },
  {
    name: 'Status',
    align: 'left',
    field: (row: DocumentInfo) => row.status === 'processing' ? (100*(row.progress??0.0)).toFixed(0) + "%" : row.status,
    label: 'Status',
    sortable: true,
  },
  {
    name: 'Last Modified',
    align: 'left',
    field: (row: DocumentInfo) => row.file.lastModified,
    label: 'Last Modified',
    sortable: true,
  },
];

const onFileChange = (newFiles: File[]) => {
  newFiles.forEach(file => {
    if (!multiFileStore.documentInfo.some(f => f.file.name === file.name)) {
      multiFileStore.addFile(file)
    }
  });

  // Clear the files variable after populating uploadedFiles
  files.value = [];

  multiFileStore.processNextDocument()
};

const processingDocuments = computed(() => {
  return multiFileStore.processing
  // return uploadedFiles.value.some(file => includes([ 'processing', 'parsing'], file.status));
});

</script>


<style scoped>
.row-styling {
  cursor: pointer;
}
</style>
