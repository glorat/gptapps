<template>
  <q-page class="row items-center justify-evenly">
    <div class="q-pa-md">
      <div class="q-gutter-md">
        <div class="q-col-12">
          <ul>
            <li>Step 1: Obtain an openai key from <a href="https://platform.openai.com/account/api-keys">your openai account</a></li>
            <li>Step 2: Enter your openai key in the top right</li>
            <li>Step 3: Use the following available tools</li>
          </ul>
        </div>
        <div class="q-col-12">
          <q-card @click="onClick()" class="my-card">
            <q-card-section class="q-pa-md">
              Large document question and answer
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

const router = useRouter()

onMounted(async () => {

})

function onClick() {
  router.push('/qdoc')

}

</script>

<style lang="sass" scoped>
.my-card
  //width: 100%
  //max-width: 300px
  //min-height: 200px
  cursor: pointer
</style>
