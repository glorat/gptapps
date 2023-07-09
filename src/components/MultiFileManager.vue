<template>
  <div>
    <q-file
      v-model="files"
      multiple
      @update:model-value="onFileChange"
      drag-and-drop
    >
      <div class="text-center">
        <p>Drag and drop files here</p>
      </div>
    </q-file>

    <q-table
      :loading="processingDocuments"
      :rows="uploadedFiles"
      row-key="file.name"
      :columns="columns"
      row-class="row-styling"
    ></q-table>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {createVectorStoreFromLargeContent} from 'src/lib/ai/largeDocQna'
import {fileToText} from 'src/lib/ai/unstructured'
import {DocumentInfo, useMultiFileStore} from 'stores/multiFileStore'

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
    field: (row: DocumentInfo) => row.status === 'processing' ? row.progress??0.0 : row.status,
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

  processNextDocument()
};

const processingDocuments = computed(() => {
  return multiFileStore.processing
  // return uploadedFiles.value.some(file => includes([ 'processing', 'parsing'], file.status));
});

const processNextDocument = async () => {
  const pendingDocument = multiFileStore.documentInfo.find(file => file.status === 'pending');

  if (pendingDocument) {
    // Set the status to 'parsing'
    pendingDocument.status = 'parsing';

    try {
      // Simulating asynchronous processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      const text = await fileToText(pendingDocument.file)
      pendingDocument.status = 'processing'
      const vectorStore = await createVectorStoreFromLargeContent(text, (p)=>{pendingDocument.progress=p})
      pendingDocument.vectors = vectorStore
      // Update the status to 'ready' on successful processing
      pendingDocument.status = 'ready';
    } catch (error) {
      // Set the status to 'error' on processing failure
      pendingDocument.status = 'error';
      console.error('Error occurred during document processing:', error);
    }

    // Call the processNextDocument function recursively to process the next document
    await processNextDocument();
  }
};

</script>


<style scoped>
.row-styling {
  cursor: pointer;
}
</style>
