import {defineStore} from 'pinia'

const savedQuestions = localStorage?.getItem('questions')

export const useQuestionStore = defineStore('questionStore', {
  state: () => ({
    questions: savedQuestions ? JSON.parse(savedQuestions) : [] as string[]
  }),
  actions: {
    saveQuestions() {
      if (localStorage) {
        localStorage.setItem('questions', JSON.stringify(this.questions))
      }
    }
  }
})
