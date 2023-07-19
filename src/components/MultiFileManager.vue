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
import {computed, markRaw, onMounted, ref} from 'vue'
import {DocumentInfo, useMultiFileStore} from 'stores/multiFileStore'
import {matCloudUpload} from '@quasar/extras/material-icons'
import {notify} from '../lib/notify'

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
    field: (row: DocumentInfo) => row.fileName,
    label: 'Name',
    sortable: true,
  },
  {
    name: 'Size (bytes)',
    align: 'left',
    field: (row: DocumentInfo) => row.fileSize,
    label: 'Size',
    sortable: true,
  },
  {
    name: 'Status',
    align: 'left',
    field: (row: DocumentInfo) => row.fileStatus === 'processing' ? (100*(row.progress??0.0)).toFixed(0) + "%" : row.fileStatus,
    label: 'Status',
    sortable: true,
  },
  {
    name: 'Last Modified',
    align: 'left',
    field: (row: DocumentInfo) => row.fileLastModified,
    label: 'Last Modified',
    sortable: true,
  },
  {
    name: 'Type',
    align: 'left',
    field: (row: DocumentInfo) => row.fileType,
    label: 'Type',
    sortable: true,
  },
];

const onFileChange = (newFiles: File[]) => {
  try {
    newFiles.forEach(file => {
      // if (!multiFileStore.documentInfo.some(f => f.fileName === file.name)) {
        const msg = multiFileStore.addFile(file)
        notify.success(msg)
      // }
    });

    multiFileStore.processNextDocument()
  } catch (e) {
    notify.error((e as Error).message)
  } finally {
    // Clear the files variable after populating uploadedFiles
    files.value = [];

  }
};

const processingDocuments = computed(() => {
  return multiFileStore.processing
  // return uploadedFiles.value.some(file => includes([ 'processing', 'parsing'], file.status));
});

onMounted(() => {
  multiFileStore.subscribe()
})

</script>


<style scoped>
.row-styling {
  cursor: pointer;
}
</style>
