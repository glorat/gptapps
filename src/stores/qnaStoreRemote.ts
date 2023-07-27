import {defineStore} from 'pinia'
import {fbGetApp, fbGetLogin} from '../lib/myfirebase'
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  orderBy,
  deleteDoc,
  CollectionReference,
  DocumentData
} from 'firebase/firestore'
import {DocumentInfo} from './multiFileStore'
import {doGeneric} from '../lib/ai/openaiFacade'
import {v4 as uuidv4} from 'uuid'

export const useQnaStoreRemote = defineStore('qnaStoreRemote', {
  state: () => ({
    unsubscribe: undefined as Unsubscribe | undefined,
    messages: [],
    workspace: 'default',
  }),
  actions: {
    getChatCol():CollectionReference<DocumentData> {
      const user = fbGetLogin()
      if (user) {
        const db = getFirestore(fbGetApp())
        const chatCol = collection(db, 'user', user.uid, 'chat')
        return chatCol
      } else {
        throw new Error('must be logged in')
      }
    },
    async performVectorStoreQna(args: { question: string }): Promise<void> {
      const chatCol = this.getChatCol()
      const msg = {
        role: 'user',
        // parentMessageId: string
        id: uuidv4(),
        message: args.question,
        conversationId: this.workspace,
        timestamp: serverTimestamp()
      }
      await setDoc(doc(chatCol, msg.id), msg)
      // trigger chat but we do NOT await
      doGeneric({}, 'documentChat', async (): Promise<void> => {
      }, false)

    },
    async subscribe(): Promise<void> {
      const user = fbGetLogin()
      if (user) {
        const db = getFirestore(fbGetApp())
        const chatCol = collection(db, 'user', user.uid, 'chat')
        const workspace = this.workspace
        const q = query(chatCol,
          where('conversationId', '==', workspace),
          orderBy('timestamp', 'desc')
        )
        if (this.unsubscribe) { // TODO: Can be smarter about caching subscription
          this.unsubscribe()
        }
        this.unsubscribe = onSnapshot(q, (querySnapshot) => {
          const docs: DocumentInfo[] = []
          querySnapshot.forEach((doc) => {
            docs.push(doc.data() as DocumentInfo)
          })
          this.messages = docs
        })
      }
    },
    async resetChat() {
      const chatCol = this.getChatCol()
      const ps = this.messages.map(msg => deleteDoc(doc(chatCol, msg.id)))
      await Promise.all(ps)
    }
  }
})
