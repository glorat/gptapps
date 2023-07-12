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

      const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

      // This is slow... need progress callback but awaiting https://github.com/hwchase17/langchainjs/issues/1861
      const docs = await textSplitter.createDocuments([text], [{name: pendingDocument.file.name}])
      // This is the old way which supports progress tracking
      // const vectorStore = await createVectorStoreFromLargeContent(text, (p)=>{pendingDocument.progress=p})
      const vectorStore = multiFileStore.vectorStore
      await vectorStore.addDocuments(docs) // TODO: deduplicate based on metadata?

      // Important to markRaw to avoid proxying the insides
      // pendingDocument.vectors = markRaw(vectorStore)
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
