import { RouteRecordRaw } from 'vue-router';
import {matAudiotrack, matHome, matPerson} from '@quasar/extras/material-icons'

const children: RouteRecordRaw[] = [
  { path: '/', component: () => import('pages/IndexPage.vue'), meta: {title:'Home', icon:matHome}  },
  { path: '/login', name: 'login', component: () => import('pages/LoginPage.vue'), meta: {title:'Login', icon:matPerson}  },
  { path: '/qdoc', name: 'docq', component: () => import('pages/DocumentQuery.vue'), meta: {title:'Document Query', icon:matPerson}  },
  { path: '/audio', name: 'audio', component: () => import('pages/AudioPage.vue'), meta: {title:'Audio', icon:matAudiotrack}  },


]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
