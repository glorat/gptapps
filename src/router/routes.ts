import { RouteRecordRaw } from 'vue-router';
import {
  matAudiotrack,
  matChat,
  matHome,
  matImage,
  matPerson,
  matSettings,
  matSource, matVolumeUp
} from '@quasar/extras/material-icons'

export const aiTools: (RouteRecordRaw & {description:string})[] = [
  { path: '/chat', name: 'chat', component: () => import('pages/ChatPage.vue'), meta: {title:'Chat', icon:matChat},
    description: 'ChatGPT'
  },
  { path: '/qdoc', name: 'docq', component: () => import('pages/DocumentQuery.vue'),
    meta: {title:'Document Query', icon:matSource},
    description: 'Large document question and answer',
  },
  { path: '/dalle', name: 'dalle', component: () => import('pages/DallePage.vue'), meta: {title:'Dall-E', icon:matImage},
    description: 'DALL-E AI image generation'
  },
  { path: '/audio', name: 'audio', component: () => import('pages/AudioPage.vue'), meta: {title:'Audio', icon:matVolumeUp},
  description:'(WIP) Audio transcriber'
  },
]

const children: RouteRecordRaw[] = [
  { path: '/', component: () => import('pages/IndexPage.vue'), meta: {title:'Home', icon:matHome}  },
  { path: '/login', name: 'login', component: () => import('pages/LoginPage.vue'), meta: {title:'Login', icon:matPerson}  },
  { path: '/settings', name: 'settings', component: () => import('pages/SettingsPage.vue'), meta: {title:'Settings', icon:matSettings}  },
  ...aiTools

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
