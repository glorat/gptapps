import { register } from 'register-service-worker';
import {Notify} from 'quasar'
import {mdiCached} from '@quasar/extras/mdi-v7';


const forceNotify = false;

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (/* registration */) {
    if (forceNotify || process.env.DEV) {
      Notify.create('App is being served from cache by a service worker.')
    }
  },

  registered (/* registration */) {
    if (forceNotify || process.env.DEV) {
      Notify.create('Service worker has been registered.')
    }
  },

  cached (/* registration */) {
    if (forceNotify || process.env.DEV) {
      Notify.create('Content has been cached for offline use.')
    }
  },

  updatefound (/* registration */) {
    if (forceNotify || process.env.DEV) {
      Notify.create('An update to this app is downloading.')
    }
    console.log('An update to this app is downloading')
  },

  updated (/* registration */) {
    // console.log('New content is available; please refresh.')
    Notify.create({
      color: 'negative',
      icon: mdiCached,
      message: 'App has been updated. Please refresh the page.',
      timeout: 0,
      multiLine: true,
      position: 'top',
      actions: [
        {
          label: 'Refresh',
          color: 'yellow',
          handler: () => {
            window.location.reload()
          }
        },
        {
          label: 'Dismiss',
          color: 'white',
          handler: () => {
          }
        }
      ]
    })
  },

  offline () {
    Notify.create('No internet connection found. App is running in offline mode.')
  },

  error ( err ) {
    Notify.create('Error during service worker registration:' + err)
  },
});
