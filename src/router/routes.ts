import { RouteRecordRaw } from 'vue-router';
import {matHome, matPerson} from '@quasar/extras/material-icons'

const children: RouteRecordRaw[] = [
  { path: '/', component: () => import('pages/IndexPage.vue'), meta: {title:'Home', icon:matHome}  },
  { path: '/login', name: 'login', component: () => import('pages/LoginPage.vue'), meta: {title:'Login', icon:matPerson}  },


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
