<template>
  <div>
    <q-file
        v-model="files"
        multiple
        filled
        color="teal"
        @update:model-value="onFileChange"
        drag-and-drop
        :loading="anyLoading"
        :label="t('label.dragHint')"
    >
      <template v-slot:prepend>
        <q-icon :name="matCloudUpload"/>
      </template>
    </q-file>

    <q-table
        bordered
        selection="multiple"
        v-model:selected="selected"
        :loading="processingDocuments"
        :rows="uploadedFiles"
        row-key="fileName"
        :columns="columns"
        row-class="row-styling"
        :no-data-label="t('label.noUpload')"
        v-model:pagination="pagination"
    >
      <template v-slot:top>
        <q-btn color="primary" :disable="anyLoading" label="Add row"/>
        <q-space/>
        <q-btn :icon="matRefresh" :disable="anyLoading" color="warning" v-if="selected.length>0" label="Reindex Selection" @click="onFilesReindex"></q-btn>
        <q-btn :icon="matDelete" :disable="anyLoading" color="warning" v-if="selected.length>0" label="Delete Selection" @click="onFilesDelete"></q-btn>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {DocumentInfo, useMultiFileStoreAsync} from '../stores/multiFileStore'
import {matCloudUpload, matDelete, matRefresh} from '@quasar/extras/material-icons'
import {notify} from '../lib/notify'
import {useI18n} from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  loading: Boolean
})

const selfLoading = ref(false)
const anyLoading = computed(() => selfLoading.value || props.loading)

const selected = ref([])
const files = ref<File[]>([])
const multiFileStore = ref(undefined)
const uploadedFiles = computed(() => multiFileStore.value?.documentInfo ?? [])
const columns = computed(() => [
  {
    name: 'File Name',
    required: true,
    align: 'left',
    field: (row: DocumentInfo) => row.fileName,
    label: t('label.name'),
    sortable: true,
  },
  {
    name: 'Size (bytes)',
    align: 'left',
    field: (row: DocumentInfo) => row.fileSize,
    label: t('label.size'),
    sortable: true,
  },
  {
    name: 'Status',
    align: 'left',
    field: (row: DocumentInfo) => row.fileStatus === 'processing' ? (100 * (row.progress ?? 0.0)).toFixed(0) + '%' : row.fileStatus,
    label: t('label.status'),
    sortable: true,
  },
  {
    name: 'Last Modified',
    align: 'left',
    field: (row: DocumentInfo) => row.fileLastModified,
    label: t('label.lastModified'),
    sortable: true,
  },
  {
    name: 'Type',
    align: 'left',
    field: (row: DocumentInfo) => row.fileType,
    label: t('label.type'),
    sortable: true,
  },
])

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

const onFilesDelete = async () => {
  try {
    selfLoading.value = true
    const ps = selected.value.map(async row => {
      const multiFileStore = await useMultiFileStoreAsync()
      return await multiFileStore.deleteFile(row.fileName)
    })
    await Promise.all(ps)
    selected.value = []
  } catch (e) {
    console.log(e)
    notify.error(e)
  } finally {
    selfLoading.value = false
  }
}

const onFilesReindex = async () => {
  try {
    selfLoading.value = true
    const ps = selected.value.map(async row => {
      const multiFileStore = await useMultiFileStoreAsync()
      return await multiFileStore.reindexFile(row.fileName)
    })
    await Promise.all(ps)
    selected.value = []
  } catch (e) {
    console.log(e)
    notify.error(e)
  } finally {
    selfLoading.value = false
  }
}

const onFileChange = (newFiles: File[]) => {
  try {
    newFiles.forEach(file => {
      // if (!multiFileStore.documentInfo.some(f => f.fileName === file.name)) {
      const msg = multiFileStore.value.addFile(file)
      // notify.success(msg)
      // }
    })

    multiFileStore.value.processNextDocument()
  } catch (e) {
    notify.error((e as Error).message)
  } finally {
    // Clear the files variable after populating uploadedFiles
    files.value = []

  }
}

const processingDocuments = computed(() => {
  return multiFileStore.value?.processing ?? false
  // return uploadedFiles.value.some(file => includes([ 'processing', 'parsing'], file.status));
})

onMounted(async () => {
  // await fbGetUser()
  multiFileStore.value = await useMultiFileStoreAsync()
  await multiFileStore.value.subscribe()
})

</script>


<style scoped>
.row-styling {
  cursor: pointer;
}
</style>
