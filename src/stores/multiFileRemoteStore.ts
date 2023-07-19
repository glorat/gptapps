import {defineStore} from 'pinia'
import {includes} from 'lodash'
import {DocumentInfo} from './multiFileStore'
import {getStorage, ref as storageRef, uploadBytes} from 'firebase/storage'

import {fbGetApp, fbGetLogin} from '../lib/myfirebase'
import {collection, getFirestore, onSnapshot, query, Unsubscribe} from 'firebase/firestore'

export const useMultiFileRemoteStore = defineStore('multiFileRemote', {
  state: () => ({
    unsubscribe: undefined as Unsubscribe|undefined,
    documentInfo: [] as DocumentInfo[] ,
  }),
  getters: {
    processing: (state):boolean => state.documentInfo.some(file => includes([ 'processing', 'parsing'], file.status)),
  },
  actions: {
    async invoke(method: string, args?: any) {

    },
    async addFile(file:File) {
      const user = fbGetLogin()
      if (user) {
        const storage = getStorage(fbGetApp())
        const uid = user.uid
        const workspace = 'default'
        const remoteRef = storageRef(storage, `user/${uid}/${workspace}/${file.name}`)
        await uploadBytes(remoteRef, file)
        return `Uploaded ${file.name}!`;
      } else {
        return new Error('Must be logged in')
      }
      // TODO: trigger processing etc.
    },
    async addBuffer(buffer:any, name:string) {
      throw new Error('not implemented')
    },
    async processNextDocument() {
      return await this.invoke('processNextDocument')
    },
    async subscribe() {
      const user = fbGetLogin()
      if (user) {
        const db = getFirestore(fbGetApp())
        const filesCol = collection(db, 'user', user.uid, 'files')
        const q = query(filesCol);
        if (this.unsubscribe) { // TODO: Can be smarter about caching subscription
          this.unsubscribe()
        }
        this.unsubscribe = onSnapshot(q, (querySnapshot) => {
          const docs:DocumentInfo[] = [];
          querySnapshot.forEach((doc) => {
            docs.push(doc.data() as DocumentInfo);
          });
          this.documentInfo = docs
        });
      }


    }
  },
})
