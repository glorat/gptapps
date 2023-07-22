import {FirebaseApp, initializeApp} from 'firebase/app'
import {getAuth, User, connectAuthEmulator} from 'firebase/auth'
import {isSupported as isAnalyticsSupported} from 'firebase/analytics'
import {connectFunctionsEmulator, getFunctions} from 'firebase/functions'
import {connectStorageEmulator, getStorage} from 'firebase/storage'
import {collection, connectFirestoreEmulator, disableNetwork, doc, getDoc, getFirestore} from 'firebase/firestore'

import * as firebaseConfig from '../staticConfig.json'
export const defaultUnstructuredUrl = `https://${firebaseConfig.projectId}.web.app`

let app: FirebaseApp;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentUser: User|undefined = undefined;


export let useEmulator = true // FIXME
export const useOfflineOnly = false

// Overrides of this need to be done before first call to getApp
export function setEmulator(use: boolean) {
  if (useEmulator !== use) {
    if (app !== undefined) throw new Error('setEmulator must be called before the first call to getApp')
    useEmulator = use
  }

}

export function fbGetApp() {
  // Initialize Firebase
  if (!app) {
    app = initializeApp(firebaseConfig, firebaseConfig.projectId);

    // useWikiCache().setFirebaseApp(app)

    if (useEmulator) {
      console.error('Emulator in use')
      // These ports must match firebase.json
      connectFirestoreEmulator(getFirestore(app), 'localhost', 8096)
      connectAuthEmulator(getAuth(app), 'http://localhost:9099');
      connectFunctionsEmulator(getFunctions(app, undefined /* FUNCTIONS_LOCATION*/ ), 'localhost', 5001);
      connectStorageEmulator(getStorage(app), 'localhost', 9199)
    }

    if (useOfflineOnly && !process.env.SERVER) {
      console.error('Disabling firestore network access')
      disableNetwork(getFirestore(app)).then(() => {
        // fbLoadSsrBundle()
      })
    }

    // Analytics not supported in unit testing environment nor ssr
    isAnalyticsSupported().then((sup) => {
      if (sup && ! useEmulator) {
        // Uncomment below when ready
        // getAnalytics(app)
        // getPerformance(app) // Performance can only start when Firebase app instance is the default one
      }
    });

    // Capture log-ins
    getAuth(app).onAuthStateChanged(async user => {
      currentUser = user ?? undefined;
      // Tell the store user has updated


      if (user) {
        console.log('firebase auth');
        // firebase.analytics().setUserId(user.uid);
        console.log(user);

      }
      else {
        console.log('firebase not auth');
      }
    });

    // Cache stuff
    console.log('Preloading data')
    // Tell store we have reset
    // useWikiCache().resetCache()


  }

  return app
}

export function fbGetAuth() {
  return getAuth(fbGetApp())
}

export function fbHasUser(): boolean {
  return !!currentUser
}

// Would this be better in a store? Try not to call this function in case it moves
export function fbGetLogin() {
  return currentUser
}

export async function fbGetCurrentUser(): Promise<any> {
  if (currentUser) {
    const db = getFirestore(fbGetApp());
    const col = collection(db, 'user');
    const userDoc = await getDoc(doc(col, currentUser.uid))
    const ret:any = userDoc.exists() ? {...userDoc.data(), id: userDoc.id} : {id: currentUser.uid}
    ret.displayName = currentUser.displayName
    return ret
  } else {
    return undefined
  }
}

