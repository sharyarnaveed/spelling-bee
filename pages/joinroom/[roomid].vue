<script setup>
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
const { $socket } = useNuxtApp();

const roomid = route.params.roomid;
const users = ref([]);
const isConnecting = ref(true);
const connectionError = ref("");
const gameStarted = ref(false);
const currentAnswer = ref("");

// Individual game state
const gameWords = ref([]);
const myCurrentWordIndex = ref(0);
const totalRounds = ref(10);
const myScore = ref(0);
const isFinished = ref(false);
const currentWord = ref("");
const answerResult = ref(null);
const gameEnded = ref(false);
const winner = ref(null);
const finalScores = ref([]);

onMounted(() => {
  const username = localStorage.getItem("name");

  if (!username) {
    router.push("/");
    return;
  }

  // Set up the listener BEFORE emitting join-room
  $socket.on("room-users", ({ users: u }) => {
    users.value = u;
    isConnecting.value = false;
    console.log("Room users updated:", u);
  });

  // Add listener for room-not-found
  $socket.on("room-not-found", () => {
    console.log("Room not found!");
    connectionError.value = "Room not found!";
    isConnecting.value = false;
  });

  // Add listener for room-full
  $socket.on("room-full", () => {
    console.log("Room is full!");
    connectionError.value = "Room is full!";
    isConnecting.value = false;
  });

  // Add listener for game-started
  $socket.on("game-started", ({ startedBy, gameState }) => {
    console.log(`Game started by ${startedBy}`);
    gameStarted.value = true;
    users.value = gameState.users;
    totalRounds.value = gameState.totalRounds;
    gameWords.value = gameState.words;
    myCurrentWordIndex.value = 0;
    myScore.value = 0;
    isFinished.value = false;
    console.log("Game state received:", gameState);
  });

  // Add listener for word-audio (individual)
  $socket.on("word-audio", ({ word, wordIndex }) => {
    console.log(`Playing word: ${word} for index ${wordIndex}`);
    currentWord.value = word;
    
    // Play text-to-speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.includes('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  });

  // Add listener for answer-result (shows all users' results)
  $socket.on("answer-result", ({ username, answer, correct, correctWord, users: updatedUsers, socketId, wordIndex }) => {
    console.log(`${username} submitted "${answer}" for word ${wordIndex} - ${correct ? 'Correct' : 'Wrong'}`);
    
    answerResult.value = {
      username,
      answer,
      correct,
      correctWord,
      isMyAnswer: socketId === $socket.id,
      wordIndex
    };
    
    // Update all users
    users.value = updatedUsers;
    
    // Clear result after 3 seconds
    setTimeout(() => {
      answerResult.value = null;
    }, 3000);
  });

  // Add listener for individual progress updates
  $socket.on("user-progress", ({ currentWordIndex, isFinished: finished, score }) => {
    console.log(`My progress: word ${currentWordIndex}, finished: ${finished}, score: ${score}`);
    myCurrentWordIndex.value = currentWordIndex;
    isFinished.value = finished;
    myScore.value = score;
    currentAnswer.value = ""; // Clear answer input
    currentWord.value = ""; // Clear current word
  });

  // Add listener for users update (when someone else progresses)
  $socket.on("users-updated", ({ users: updatedUsers }) => {
    users.value = updatedUsers;
  });

  // Add listener for game-ended
  $socket.on("game-ended", ({ winner: gameWinner, finalScores: scores }) => {
    console.log("Game ended!", gameWinner, scores);
    gameEnded.value = true;
    winner.value = gameWinner;
    finalScores.value = scores;
  });

  // Now emit join-room AFTER listeners are set up
  $socket.emit("join-room", {
    roomid,
    username,
  });
});

// Clean up socket listeners when component unmounts
onUnmounted(() => {
  $socket.off("room-users");
  $socket.off("room-not-found");
  $socket.off("room-full");
  $socket.off("game-started");
  $socket.off("word-audio");
  $socket.off("answer-result");
  $socket.off("user-progress");
  $socket.off("users-updated");
  $socket.off("game-ended");
});

const leaveRoom = () => {
  $socket.emit("leave-room", { roomid });
  router.push("/");
};

const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomid);
    alert("Room ID copied!");
  } catch (err) {
    console.error("Failed to copy room ID:", err);
  }
};

const handleStartGame = () => {
  $socket.emit("start-game", { roomid });
};

const handlePlaySound = () => {
  if (!isFinished.value && myCurrentWordIndex.value < gameWords.value.length) {
    $socket.emit("play-word", { 
      roomid, 
      wordIndex: myCurrentWordIndex.value 
    });
    console.log("Playing word sound for index:", myCurrentWordIndex.value);
  }
};

const handleSubmit = () => {
  if (currentAnswer.value.trim() && !isFinished.value) {
    $socket.emit("submit-answer", {
      roomid,
      answer: currentAnswer.value.trim(),
      wordIndex: myCurrentWordIndex.value
    });
    console.log("Submitted answer:", currentAnswer.value, "for word index:", myCurrentWordIndex.value);
  }
};

const handleNext = () => {
  if (!isFinished.value) {
    $socket.emit("next-word", { 
      roomid,
      wordIndex: myCurrentWordIndex.value
    });
    console.log("Skipping word index:", myCurrentWordIndex.value);
  }
};

const playAgain = () => {
  gameEnded.value = false;
  gameStarted.value = false;
  winner.value = null;
  finalScores.value = [];
  currentAnswer.value = "";
  answerResult.value = null;
  myCurrentWordIndex.value = 0;
  myScore.value = 0;
  isFinished.value = false;
  currentWord.value = "";
};

// Computed property for current round display
const currentRound = computed(() => myCurrentWordIndex.value + 1);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Game Ended Modal -->
      <div
        v-if="gameEnded"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="text-6xl mb-4">🏆</div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
            <p class="text-xl text-amber-600 mb-6">
              Winner: <span class="font-bold">{{ winner.username }}</span>
            </p>
            
            <!-- Final Scores -->
            <div class="space-y-3 mb-6">
              <h3 class="text-lg font-semibold text-gray-700">Final Scores:</h3>
              <div
                v-for="(user, index) in finalScores"
                :key="user.socketId"
                class="flex justify-between items-center bg-gray-100 rounded-lg p-3"
              >
                <div class="flex items-center gap-2">
                  <span>{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
                  <span class="font-medium">{{ user.username }}</span>
                </div>
                <span class="font-bold text-amber-600">{{ user.score }}</span>
              </div>
            </div>
            
            <button
              @click="playAgain"
              class="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>

      <!-- Answer Result Display -->
      <div
        v-if="answerResult"
        class="fixed top-4 right-4 z-40 p-4 rounded-xl shadow-lg max-w-sm"
        :class="answerResult.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
      >
        <div class="flex items-center gap-2">
          <span v-if="answerResult.correct">✅</span>
          <span v-else">❌</span>
          <div class="flex-1">
            <p class="font-bold">
              {{ answerResult.isMyAnswer ? 'You' : answerResult.username }}
              {{ answerResult.correct ? 'got it right!' : 'got it wrong!' }}
            </p>
            <p class="text-sm">Answer: {{ answerResult.answer }}</p>
            <p v-if="!answerResult.correct" class="text-xs">
              Correct: {{ answerResult.correctWord }}
            </p>
            <p class="text-xs mt-1">
              {{ answerResult.correct ? '+10 points' : '-5 points' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Connecting State -->
      <div
        v-if="isConnecting"
        class="flex items-center justify-center min-h-screen"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-6"></div>
          <p class="text-gray-600 text-lg">Connecting to room...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="connectionError"
        class="flex items-center justify-center min-h-screen"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full">
          <div class="text-8xl mb-6">❌</div>
          <h2 class="text-3xl font-bold text-red-600 mb-3">{{ connectionError }}</h2>
          <p class="text-gray-600 mb-6">Unable to join this room.</p>
          <button
            @click="router.push('/')"
            class="px-8 py-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 border-4 border-amber-300">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="text-5xl">🐝</div>
              <div>
                <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Spelling Bee
                </h1>
                <p class="text-sm text-gray-500">Multiplayer Challenge</p>
              </div>
            </div>
            <button
              @click="leaveRoom"
              class="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all transform hover:scale-105 font-semibold shadow-lg flex items-center gap-2"
            >
              Leave Room
            </button>
          </div>

          <!-- Room ID Display -->
          <div class="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-5 border-2 border-dashed border-amber-400">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm text-amber-700 font-medium">Room ID:</span>
                <p class="text-3xl font-mono font-bold text-amber-600 tracking-wider">{{ roomid }}</p>
              </div>
              <button
                @click="copyRoomId"
                class="px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all transform hover:scale-105 font-semibold shadow-md flex items-center gap-2"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <!-- Lobby View -->
        <div
          v-if="!gameStarted"
          class="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-200"
        >
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
              Players in Room
              <span class="text-lg text-gray-500 font-normal">({{ users.length }}/2)</span>
            </h2>
            <div class="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-green-700 font-semibold">Connected</span>
            </div>
          </div>

          <!-- Players Grid -->
          <div
            v-if="users.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
          >
            <div
              v-for="(user, index) in users"
              :key="user.socketId"
              class="bg-gradient-to-br from-amber-50 to-yellow-50 border-3 border-amber-300 rounded-2xl p-8 text-center transform transition-all hover:scale-105 shadow-lg"
            >
              <div class="text-6xl mb-4">{{ index === 0 ? "👑" : "👤" }}</div>
              <p class="font-bold text-2xl text-gray-800 mb-1">{{ user.username }}</p>
              <span
                v-if="index === 0"
                class="inline-block px-3 py-1 bg-amber-500 text-white text-xs rounded-full font-semibold"
              >
                HOST
              </span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="text-6xl mb-4">🏃‍♂️</div>
            <p class="text-gray-500 text-lg">Waiting for players to join...</p>
          </div>

          <!-- Start Game Section -->
          <div v-if="users.length > 0" class="border-t-2 border-amber-200 pt-8">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-gray-600 text-lg mb-2">🎯 Ready to test your spelling skills?</p>
                <p class="text-sm text-gray-500">Share the room ID with friends to invite them!</p>
              </div>
              <button
                @click="handleStartGame"
                :disabled="users.length < 1"
                :class="[
                  'px-8 py-4 rounded-xl font-bold text-lg shadow-xl transform transition-all flex items-center gap-3',
                  users.length >= 1
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                {{ users.length >= 1 ? "Start Game" : "Need Players" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Game View -->
        <div v-else class="space-y-6">
          <!-- My Progress and Score -->
          <div class="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold text-gray-800">📈 My Progress</h3>
              <div class="text-right">
                <p class="text-sm text-gray-500">My Score</p>
                <p class="text-3xl font-bold text-amber-600">{{ myScore }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between bg-amber-50 rounded-xl p-4">
              <div>
                <p class="text-lg font-bold text-gray-800">
                  Word {{ currentRound }} of {{ totalRounds }}
                </p>
                <p class="text-sm text-gray-600">
                  {{ isFinished ? 'Completed!' : 'In Progress' }}
                </p>
              </div>
              <div class="text-4xl">
                {{ isFinished ? '🎉' : '📝' }}
              </div>
            </div>
          </div>

          <!-- All Players Scoreboard -->
          <div class="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">📊 All Players</h3>
            <div class="space-y-3">
              <div
                v-for="(user, index) in users.slice().sort((a, b) => (b.score || 0) - (a.score || 0))"
                :key="user.socketId"
                class="flex items-center justify-between p-4 rounded-xl border-2"
                :class=" [
                  user.socketId === $socket.id 
                    ? 'bg-amber-100 border-amber-400' 
                    : 'bg-gray-50 border-gray-200'
                ]"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </span>
                  <div>
                    <span class="font-bold text-lg text-gray-800">
                      {{ user.username }}
                      {{ user.socketId === $socket.id ? ' (You)' : '' }}
                    </span>
                    <p class="text-sm text-gray-500">
                      Word {{ (user.currentWordIndex || 0) + 1 }} / {{ totalRounds }}
                      {{ user.isFinished ? ' - Finished!' : '' }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-2xl font-bold text-amber-600">{{ user.score || 0 }}</span>
                  <p class="text-xs text-gray-500">points</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Controls -->
          <div
            v-if="!isFinished"
            class="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-200"
          >
            <div class="text-center mb-8">
              <h3 class="text-3xl font-bold text-gray-800 mb-2">🎯 Spell the Word!</h3>
              <p class="text-gray-600">Listen carefully and type your answer</p>
              <div class="mt-4 flex justify-center gap-4 text-sm">
                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  ✅ Correct: +10 points
                </span>
                <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  ❌ Wrong: -5 points
                </span>
              </div>
            </div>

            <!-- Play Sound Button -->
            <div class="flex justify-center mb-8">
              <button
                @click="handlePlaySound"
                class="px-12 py-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 font-bold text-xl shadow-2xl flex items-center gap-4"
              >
                🔊 Play Word {{ currentRound }}
              </button>
            </div>

            <!-- Answer Input -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                Your Answer:
              </label>
              <input
                v-model="currentAnswer"
                type="text"
                @keypress.enter="handleSubmit"
                placeholder="Type the spelling here..."
                class="w-full px-6 py-4 text-2xl border-3 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400 focus:border-amber-500 font-mono text-center uppercase tracking-widest"
              />
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-4">
              <button
                @click="handleSubmit"
                :disabled="!currentAnswer.trim()"
                :class=" [
                  'px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all flex items-center justify-center gap-3',
                  currentAnswer.trim()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                Submit Answer
              </button>
              <button
                @click="handleNext"
                class="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center gap-3"
              >
                Skip Word
              </button>
            </div>

            <!-- My Progress Bar -->
            <div class="mt-8">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>My Progress</span>
                <span>{{ Math.round((myCurrentWordIndex / totalRounds) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${(myCurrentWordIndex / totalRounds) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Finished State -->
          <div
            v-else
            class="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-300 text-center"
          >
            <div class="text-6xl mb-4">🎉</div>
            <h3 class="text-3xl font-bold text-gray-800 mb-2">You're Done!</h3>
            <p class="text-gray-600 mb-4">Final Score: <span class="font-bold text-green-600">{{ myScore }}</span></p>
            <p class="text-sm text-gray-500">Waiting for other players to finish...</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
