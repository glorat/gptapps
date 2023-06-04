<template>
  <div v-if="hasUser">
    <q-btn color="primary" @click="logout">Logout</q-btn>
  </div>
  <section v-show="!hasUser" id="firebaseui-auth-container"></section>
</template>

<script setup>
import {computed, onMounted} from 'vue';
import {fbGetAuth, fbHasUser} from 'src/lib/myfirebase';
import {GoogleAuthProvider, EmailAuthProvider, signOut} from 'firebase/auth'
import {notify} from 'src/lib/notify';

const logout = async () => {
  await signOut(fbGetAuth());
  notify.success('You have been logged out')
}

const hasUser = computed(() => fbHasUser())
onMounted(async() => {
  const firebaseui = await import('firebaseui');
  let ui = firebaseui.auth.AuthUI.getInstance();
  if (!ui) {
    let fauth = fbGetAuth()
    ui = new firebaseui.auth.AuthUI(fauth);
  }

  const uiConfig = {
    signInSuccessUrl: '/', // This redirect can be achieved by route using callback.
    // signInFlow: "popup",

    signInOptions: [
      GoogleAuthProvider.PROVIDER_ID,
      EmailAuthProvider.PROVIDER_ID
    ]
  };
  ui.start('#firebaseui-auth-container', uiConfig);

})

</script>

<style scoped>

</style>
