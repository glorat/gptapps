import {FirebaseApp, initializeApp} from 'firebase/app'
import {getAuth, User} from 'firebase/auth'
import {getAnalytics, isSupported as isAnalyticsSupported} from 'firebase/analytics'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  disableNetwork,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  getFirestore,
  loadBundle,
  query,
  Query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'


const firebaseConfig = {
  apiKey: 'AIzaSyDcvODUMsAmXA_gB4FIh0OvJ7yJ-OmoeoE',
  authDomain: 'glorat-gptapps.firebaseapp.com',
  projectId: 'glorat-gptapps',
  storageBucket: 'glorat-gptapps.appspot.com',
  messagingSenderId: '33744445712',
  appId: '1:33744445712:web:c3fb41e230852510800595',
  measurementId: 'G-4BXW5R3DR2'
};

let app: FirebaseApp;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentUser: User|undefined = undefined;


export let useEmulator = false
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
      connectFirestoreEmulator(getFirestore(app), 'localhost', 8081)
      // connectAuthEmulator(getAuth(app), 'http://localhost:9099');
      // connectFunctionsEmulator(getFunctions(app, 'asia-northeast1'), 'localhost', 5001);
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

