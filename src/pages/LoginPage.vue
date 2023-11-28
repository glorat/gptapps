<template>
  <h1 class="text-h6">User</h1>
  <template v-if="hasUser">
    <p>Hello {{ displayName }}</p>
    <template v-if="loading==false">
<!--      <p v-if="!profile.nickname">You have not previously set a nickname. Please submit now</p>-->
<!--      <q-input v-model="profile.nickname" label="Nickname" minlength="3" required></q-input>-->
<!--      <q-btn color="primary" label="Submit Profile" @click="onSubmit"></q-btn>-->
    </template>
    <q-separator size="10"></q-separator>
  </template>
  <template v-else>
    <p>
      You are currently not logged in.
    </p>
  </template>

  <firebase-login></firebase-login>
</template>

<script lang="ts" setup>
import 'firebaseui/dist/firebaseui.css';

import FirebaseLogin from 'components/FirebaseLogin.vue'
import {computed, onMounted, reactive, ref} from 'vue'
// import {User} from 'firebase/auth'
import {notify} from 'src/lib/notify'
import {useRouter} from 'vue-router'
import {fbGetCurrentUser, fbHasUser} from 'src/lib/myfirebase'

const hasUser = computed(() => fbHasUser())

const loading = ref(false)
const displayName = ref('unknown')
const profile = reactive({nickname: displayName})

onMounted(async() => {
  try {
    if (hasUser.value) {
      loading.value = true
      const exist = await fbGetCurrentUser()
      // Object.assign?

      profile.nickname = exist.nickname
      displayName.value = exist.displayName
      loading.value = false
    } else {
      await useRouter().push('/login')
    }
  }
  catch (e:any) {
    notify.error(e.toString())
  }

})

</script>

<style scoped>

</style>

