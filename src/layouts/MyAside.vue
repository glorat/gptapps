<template>
  <q-scroll-area class="fit myaside">
    <q-list v-for="(menuItems, index) in menuItemsList" :key="index">
      <div v-for="(menuItem, idx2) in menuItems" :key="idx2">
        <!-- -->
        <q-item clickable v-ripple :to="menuItem.path" :id="`route-${menuItem.path.replace('/','')}`" >
          <q-item-section avatar>
            <q-icon :name="menuItem.meta.icon"/>
          </q-item-section>
          <q-item-section>
            {{ menuItem.meta.title }}
          </q-item-section>
        </q-item>
      </div>
      <q-separator/>
    </q-list>
    <q-list>
      <q-item>v{{ version }}</q-item>
    </q-list>
  </q-scroll-area>
</template>

<script lang="ts" setup>

import routes from 'src/router/routes';
import { version } from '../../package.json'

const navBar = [
  ['', 'login', 'qdoc', 'audio']
];

const menuItemsList = navBar.map(ss => {
  return ss.map((key: string) => {
    return routes[0].children && routes[0].children.find(rt => rt.path === `/${key}`)
  })
})

</script>

<style scoped>

</style>
