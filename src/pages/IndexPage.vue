<template>
  <q-page class="row items-center justify-evenly">
    <div class="q-pa-md">
      <div class="q-gutter-md">
        <div class="q-col-12">
          <markdown-render page="home.md"></markdown-render>
        </div>
        <div class="q-col-12">
          <q-card v-for="tool in tools" :key="tool.path" @click="onClick(tool.path)" class="my-card">
            <q-card-section class="q-pa-md">
              {{ tool.description }}
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {onMounted, ref, Ref} from 'vue'
import {useRouter} from 'vue-router'
import MarkdownRender from 'components/MarkdownRender.vue'

const router = useRouter()

const tools = [
  {path: '/qdoc', description: 'Large document question and answer'},
  {path: '/dalle', description: 'DALL-E AI image generation'},
]

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
