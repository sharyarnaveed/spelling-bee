import { defineStore } from "pinia";

export const useStoreWordsTore = defineStore("words", {
  state: () => ({
    words: [],
    currentIndex: 0,
    ended: false,
  }),
  getters: {
    currentWord(state) {
      return state.words[state.currentIndex] || null;
    },
    isitEnded() {
      return this.ended;
    },
  },
  actions: {
    nextWord() {
      if (this.currentIndex < this.words.length - 1) {
        this.currentIndex++;
      } else {
        this.ended = true;
      }
    },
    reset() {
      this.currentIndex = 0;
      this.ended = false;
    },
    setWords(newWords) {
      this.words = newWords;
      this.currentIndex = 0;
      this.ended = false;
    },
    cleararray(){
      this.words.length=0
      console.log(this.words);
      
    }
  },
});
