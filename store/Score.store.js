import { defineStore } from "pinia";

export const useStoreScores = defineStore("score", {
  state: () => ({
    correct: 0,
    incorrect: 0,
    score: 0,
  }),
  getters: {
    currectstats() {
      return {
        correct: this.correct,
        incorrect: this.incorrect,
        score: this.score,
      };
    },
  },
  actions: {
    winscore() {
      this.correct++;
      this.score = this.score + 50;
    },
    loosescore() {
      this.incorrect++;
      this.score = this.score - 50;
    },
    clear()
    {
      this.correct=0,
      this.incorrect=0,
      this.score=0
    }
  },
});
