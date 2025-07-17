<script setup>
import { useStoreScores } from "~/store/Score.store";
import { useStoreWordsTore } from "~/store/Wordsstore";

const difficultylevel = useRoute().query.difficulty;
const wordsStore = useStoreWordsTore();
const scoreStore = useStoreScores();
const startgame=ref(false)
const userinput = ref("");
const wordslist = ref([]);
const showError = ref(false);
const showerrormsh = ref("");
const showSuccess = ref(false);
const showSuccessmsg = ref("");

function getrandomwords(count) {
  const shuffle = [...wordslist.value].sort(() => 0.5 - Math.random());
  return shuffle.slice(0, count);
}

function next() {
  if (userinput.value == "") {
    showError.value = true;
    setTimeout(() => {
      showError.value = false;
    }, 3000);
    showerrormsh.value = "write something";
  } else {
    console.log(userinput.value);

    if (
      userinput.value.toLowerCase() == wordsStore.currentWord.toLowerCase() ||
      userinput.value.toUpperCase() == wordsStore.currentWord.toUpperCase()
    ) {
      scoreStore.winscore();
    } else {
      scoreStore.loosescore();
    }

    userinput.value = "";

    showSuccess.value = true;
    showSuccessmsg.value = "next word loaded";
    setTimeout(() => {
      showSuccess.value = false;
    }, 3000);

    wordsStore.nextWord();
    playsound();
  }
}

function reset() {
  wordsStore.reset();
}

function playsound() {
  const uttrance = new SpeechSynthesisUtterance(wordsStore.currentWord);
  const voices = speechSynthesis.getVoices();
  uttrance.voice = voices.find((v) => v.lang === "en-US");
  speechSynthesis.speak(uttrance);
}

const isDisable = computed(() => {
  return wordsStore.ended === true;
});

onMounted(async () => {
  startgame.value=true
  if (!wordsStore.words || wordsStore.words.length === 0) {
    const responce = await fetch(`/words/${difficultylevel}.txt`);
    const words = await responce.text();
    wordslist.value = words
      .split("\n")
      .map((w) => w.trim())
      .filter(Boolean);
    const randomwords = getrandomwords(5);
    wordsStore.setWords(randomwords);
    console.log(wordsStore.words);
  }

setTimeout(()=>
{
startgame.value=false
},[5000])

});
</script>

<template>
  <Banner v-if="startgame"/>
  <Endbanner v-if="isDisable"/>
  <main
    class="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 relative overflow-hidden"
  >
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse
        sm:w-72 sm:h-72 md:w-96 md:h-96"
      ></div>
      <div
        class="absolute top-3/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse
        sm:w-56 sm:h-56 md:w-80 md:h-80"
        style="animation-delay: 2s"
      ></div>
      <div
        class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse
        sm:w-40 sm:h-40 md:w-64 md:h-64"
        style="animation-delay: 4s"
      ></div>
    </div>
    <ErrorToast v-if="showError" :message="showerrormsh" />
    <SuccessToast v-if="showSuccess" :message="showSuccessmsg" />
    <div class="relative z-10 min-h-screen p-6 sm:p-4">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button
          @click="$router.push('/start')"
          class="group flex items-center px-6 py-3 bg-yellow-500/10 hover:bg-yellow-400/20 backdrop-blur-md border border-yellow-400/30 hover:border-yellow-300/50 text-yellow-100 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
        >
          <svg
            class="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back
        </button>

        <div
          class="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 rounded-full shadow-lg"
        >
          <span class="text-white font-bold text-lg capitalize">{{
            difficultylevel || "Beginner"
          }}</span>
        </div>

        <div
          class="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/30 px-6 py-3 rounded-xl"
        >
          <div class="text-yellow-100 text-center">
            <div class="text-2xl font-bold">{{ scoreStore.score }}</div>
            <div class="text-sm opacity-75">Score</div>
          </div>
        </div>
      </div>

      <div class="max-w-4xl mx-auto w-full px-2">
        <div class="text-center mb-12">
          <div class="relative inline-block mb-8">
            <div
              class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse"
            ></div>
            <div
              class="relative bg-gradient-to-r from-yellow-400 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl
              sm:w-16 sm:h-16 md:w-20 md:h-20"
            >
              <span class="text-3xl animate-bounce">🐝</span>
            </div>
          </div>

          <div
            class="bg-yellow-500/10 backdrop-blur-md border-2 border-yellow-400/30 rounded-3xl p-8 mb-8 shadow-2xl
            sm:p-4"
          >
            <div class="text-xl text-yellow-100/80 font-medium sm:text-lg">
              Spell the word you hear
            </div>
          </div>

          <button
            class="group relative bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
            sm:px-4 sm:py-2 sm:text-base"
            @click="playsound"
          >
            <div class="flex items-center justify-center">
              <svg
                class="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Audio
            </div>
          </button>
        </div>

        <div class="max-w-2xl mx-auto mb-8 w-full px-2">
          <div class="relative">
            <input
              type="text"
              placeholder="Type your answer here..."
              :disabled="isDisable"
              v-model="userinput"
              class="w-full px-6 py-6 text-2xl font-medium text-center bg-yellow-500/10 backdrop-blur-md border-2 border-yellow-400/30 focus:border-yellow-300/50 rounded-2xl text-yellow-100 placeholder-yellow-300/50 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all duration-300
              sm:px-3 sm:py-3 sm:text-lg"
            />
            <div
              class="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-400/5 rounded-2xl pointer-events-none"
            ></div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            type="submit"
            class="group relative bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all duration-300 transform hover:scale-105
            sm:px-4 sm:py-2 sm:text-base"
            @click="next"
            :disabled="isDisable"
          >
            <div class="flex items-center justify-center">
              <svg
                class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {{ isDisable ? "Game Ended" : "Submit" }}
            </div>
          </button>

          <button
            class="group relative bg-yellow-500/20 hover:bg-yellow-400/30 backdrop-blur-md border-2 border-yellow-400/30 hover:border-yellow-300/50 px-8 py-4 rounded-xl font-bold text-yellow-100 text-lg transition-all duration-300 transform hover:scale-105
            sm:px-4 sm:py-2 sm:text-base"
          >
            <div class="flex items-center justify-center">
              <svg
                class="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Replay
            </div>
          </button>

          <button
            class="group relative bg-blue-500/20 hover:bg-blue-400/30 backdrop-blur-md border-2 border-blue-400/30 hover:border-blue-300/50 px-8 py-4 rounded-xl font-bold text-blue-100 text-lg transition-all duration-300 transform hover:scale-105
            sm:px-4 sm:py-2 sm:text-base"
          >
            <div class="flex items-center justify-center">
              <svg
                class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Hint
            </div>
          </button>
        </div>

        <div class="max-w-2xl mx-auto w-full px-2">
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-yellow-100 font-medium">Progress</span>
              <span class="text-yellow-100 font-medium"
                >{{ wordsStore.currentIndex + 1 }} / 5</span
              >
            </div>
            <div
              class="w-full bg-yellow-500/20 rounded-full h-3 overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                :style="{
                  width: ((wordsStore.currentIndex + 1) / 5) * 100 + '%',
                }"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 sm:grid-cols-1">
            <div
              class="bg-yellow-500/10 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 text-center"
            >
              <div class="text-2xl font-bold text-yellow-100 sm:text-xl">
                {{ scoreStore.correct }}
              </div>
              <div class="text-sm text-yellow-100/70">Correct</div>
            </div>
            <div
              class="bg-red-500/10 backdrop-blur-md border border-red-400/30 rounded-xl p-4 text-center"
            >
              <div class="text-2xl font-bold text-red-200 sm:text-xl">
                {{ scoreStore.incorrect }}
              </div>
              <div class="text-sm text-red-200/70">Wrong</div>
            </div>
            <div
              class="bg-blue-500/10 backdrop-blur-md border border-blue-400/30 rounded-xl p-4 text-center"
            >
              <div class="text-2xl font-bold text-blue-200 sm:text-xl">0</div>
              <div class="text-sm text-blue-200/70">Hints Used</div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="fixed top-20 left-20 text-4xl animate-bounce opacity-20
        sm:text-2xl sm:top-10 sm:left-10"
        style="animation-delay: 0s"
      >
        🌟
      </div>
      <div
        class="fixed top-40 right-32 text-3xl animate-pulse opacity-20
        sm:text-xl sm:top-20 sm:right-10"
        style="animation-delay: 1s"
      >
        ✨
      </div>
      <div
        class="fixed bottom-32 left-40 text-4xl animate-bounce opacity-20
        sm:text-2xl sm:bottom-16 sm:left-10"
        style="animation-delay: 2s"
      >
        🎯
      </div>
      <div
        class="fixed bottom-20 right-20 text-3xl animate-pulse opacity-20
        sm:text-xl sm:bottom-10 sm:right-10"
        style="animation-delay: 3s"
      >
        🏆
      </div>
    </div>
  </main>
</template>
