<template>
  <q-page class="row items-center justify-evenly">
    <div class="q-pa-md">
      <div class="q-gutter-md">
        <div class="q-col-12">
          <markdown-render page="home.md"></markdown-render>
        </div>
        <div class="q-col-12">
          <q-card v-for="tool in tools" :key="tool.path" @click="onClick(tool.path)" class="my-card">
            <q-card-section horizontal>
              <q-card-section><q-avatar color="primary" text-color="white" :icon="tool.meta.icon"></q-avatar></q-card-section>
              <q-card-section class="q-pa-md">
                <span>{{ tool.description }}</span>
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {onMounted} from 'vue'
import {useRouter} from 'vue-router'
import MarkdownRender from 'components/MarkdownRender.vue'
import {aiTools} from '../router/routes'

const router = useRouter()

const tools = aiTools

onMounted(async () => {

})

function onClick(path:string) {
  router.push(path)

}

</script>

<style lang="sass" scoped>
.my-card
  //width: 100%
  //max-width: 300px
  //min-height: 200px
  cursor: pointer
</style>
