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

  // Get current user information for userId
  const { account } = useAppwrite();

  // Set up the listener BEFORE emitting create-room
  $socket.on("room-users", ({ users: u }) => {
    users.value = u;
    isConnecting.value = false;
    console.log("Room users updated:", u);
  });

  // Add listener for room-created
  $socket.on("room-created", ({ roomid: createdRoomId }) => {
    console.log("Room created:", createdRoomId);
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
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.5;
      utterance.pitch = 1.2;
      utterance.volume = 1;

      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.includes("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      speechSynthesis.speak(utterance);
    }
  });

  // Add listener for answer-result (shows all users' results)
  $socket.on(
    "answer-result",
    ({
      username,
      answer,
      correct,
      correctWord,
      users: updatedUsers,
      socketId,
      wordIndex,
    }) => {
      console.log(
        `${username} submitted "${answer}" for word ${wordIndex} - ${
          correct ? "Correct" : "Wrong"
        }`
      );

      answerResult.value = {
        username,
        answer,
        correct,
        correctWord,
        isMyAnswer: socketId === $socket.id,
        wordIndex,
      };

      // Update all users
      users.value = updatedUsers;

      // Clear result after 3 seconds
      setTimeout(() => {
        answerResult.value = null;
      }, 3000);
    }
  );

  // Add listener for individual progress updates
  $socket.on(
    "user-progress",
    ({ currentWordIndex, isFinished: finished, score }) => {
      console.log(
        `My progress: word ${currentWordIndex}, finished: ${finished}, score: ${score}`
      );
      myCurrentWordIndex.value = currentWordIndex;
      isFinished.value = finished;
      myScore.value = score;
      currentAnswer.value = ""; // Clear answer input
      currentWord.value = ""; // Clear current word
    }
  );

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

  // Get current user and emit create-room AFTER listeners are set up
  account.get().then((user) => {
    $socket.emit("create-room", {
      roomid,
      username,
      userId: user.$id, // Include user ID from Appwrite
    });
    console.log("Creating room with user ID:", user.$id);
  }).catch((error) => {
    console.error("Error getting user info:", error);
    // Fallback: create room without userId
    $socket.emit("create-room", {
      roomid,
      username,
      userId: null,
    });
  });
});

// Clean up socket listeners when component unmounts
onUnmounted(() => {
  $socket.off("room-users");
  $socket.off("room-created");
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
      wordIndex: myCurrentWordIndex.value,
    });
    console.log("Playing word sound for index:", myCurrentWordIndex.value);
  }
};

const handleSubmit = () => {
  if (currentAnswer.value.trim() && !isFinished.value) {
    $socket.emit("submit-answer", {
      roomid,
      answer: currentAnswer.value.trim(),
      wordIndex: myCurrentWordIndex.value,
    });
    console.log(
      "Submitted answer:",
      currentAnswer.value,
      "for word index:",
      myCurrentWordIndex.value
    );
  }
};

const handleNext = () => {
  if (!isFinished.value) {
    $socket.emit("next-word", {
      roomid,
      wordIndex: myCurrentWordIndex.value,
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
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
    <!-- Top Navigation Bar - Fixed -->
    <div class="sticky top-0 z-30 bg-white border-b-2 border-amber-200 shadow-lg">
      <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo and Title -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="text-2xl sm:text-3xl lg:text-4xl">🐝</div>
            <div>
              <h1 class="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Spelling Bee
              </h1>
              <p class="text-xs text-gray-500 hidden sm:block">Multiplayer Challenge - Host</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Copy Room ID Button -->
            <button
              @click="copyRoomId"
              class="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 font-semibold shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <span class="text-sm">📋</span>
              <span class="hidden sm:inline">Copy ID</span>
              <span class="sm:hidden">Copy</span>
            </button>

            <!-- Leave Room Button -->
            <button
              @click="leaveRoom"
              class="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 font-semibold shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <span class="text-sm">🚪</span>
              <span class="hidden sm:inline">Leave</span>
              <span class="sm:hidden">Exit</span>
            </button>
          </div>
        </div>

        <!-- Room ID Display -->
        <div class="mt-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-3 border border-dashed border-amber-400">
          <div class="text-center">
            <span class="text-xs text-amber-700 font-medium">Room ID:</span>
            <p class="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-amber-600 tracking-wider break-all">{{ roomid }}</p>
            <p class="text-xs text-amber-600 mt-1">👑 You are the host</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <!-- Game Ended Modal -->
      <div
        v-if="gameEnded"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="text-center">
            <div class="text-4xl sm:text-5xl lg:text-6xl mb-4">🏆</div>
            <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
            <p class="text-base sm:text-lg lg:text-xl text-amber-600 mb-6">
              Winner: <span class="font-bold">{{ winner.username }}</span>
            </p>

            <!-- Final Scores -->
            <div class="space-y-2 sm:space-y-3 mb-6">
              <h3 class="text-sm sm:text-base lg:text-lg font-semibold text-gray-700">Final Scores:</h3>
              <div
                v-for="(user, index) in finalScores"
                :key="user.socketId"
                class="flex justify-between items-center bg-gray-100 rounded-lg p-2 sm:p-3"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm sm:text-base">{{ index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉" }}</span>
                  <span class="font-medium text-sm sm:text-base truncate">{{ user.username }}</span>
                </div>
                <span class="font-bold text-amber-600 text-sm sm:text-base">{{ user.score }}</span>
              </div>
            </div>

            <button
              @click="playAgain"
              class="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg transform hover:scale-105 text-sm sm:text-base"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>

      <!-- Answer Result Display -->
      <div
        v-if="answerResult"
        class="fixed top-20 left-3 right-3 sm:top-24 sm:right-4 sm:left-auto z-40 p-3 sm:p-4 rounded-xl shadow-lg max-w-sm mx-auto sm:mx-0"
        :class="answerResult.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
      >
        <div class="flex items-start gap-2">
          <span class="text-lg sm:text-xl mt-1">{{ answerResult.correct ? '✅' : '❌' }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm sm:text-base leading-tight">
              {{ answerResult.isMyAnswer ? 'You' : answerResult.username }}
              {{ answerResult.correct ? 'got it right!' : 'got it wrong!' }}
            </p>
            <p class="text-xs sm:text-sm opacity-90 truncate">Answer: {{ answerResult.answer }}</p>
            <p v-if="!answerResult.correct" class="text-xs opacity-90 truncate">
              Correct: {{ answerResult.correctWord }}
            </p>
            <p class="text-xs mt-1 font-semibold">
              {{ answerResult.correct ? '+10 points' : '-5 points' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Connecting State -->
      <div
        v-if="isConnecting"
        class="flex items-center justify-center min-h-[70vh] px-4"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 text-center max-w-md w-full">
          <div class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-6"></div>
          <p class="text-gray-600 text-sm sm:text-base lg:text-lg">Creating room...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="connectionError"
        class="flex items-center justify-center min-h-[70vh] px-4"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 text-center max-w-md w-full">
          <div class="text-5xl sm:text-6xl lg:text-8xl mb-6">❌</div>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mb-3">{{ connectionError }}</h2>
          <p class="text-gray-600 mb-6 text-sm sm:text-base">Unable to create this room.</p>
          <button
            @click="router.push('/')"
            class="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg shadow-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Lobby View -->
        <div
          v-if="!gameStarted"
          class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-amber-200"
        >
          <!-- Header with Connection Status -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <h2 class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <span>👥</span>
              <span>Players in Room</span>
              <span class="text-sm sm:text-base lg:text-lg text-gray-500 font-normal">({{ users.length }}/2)</span>
            </h2>
            <div class="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 px-3 sm:px-4 py-2 rounded-full border border-green-200">
              <div class="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs sm:text-sm text-green-700 font-semibold">Host Ready</span>
            </div>
          </div>

          <!-- Players Grid -->
          <div
            v-if="users.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            <div
              v-for="(user, index) in users"
              :key="user.socketId"
              class="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center transform transition-all hover:scale-105 shadow-lg"
            >
              <div class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-2 sm:mb-3 lg:mb-4">
                {{ index === 0 ? "👑" : "👤" }}
              </div>
              <p class="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-800 mb-1 break-words">
                {{ user.username }}
              </p>
              <span
                v-if="index === 0"
                class="inline-block px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm rounded-full font-semibold shadow-md"
              >
                HOST
              </span>
              <span
                v-else
                class="inline-block px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs sm:text-sm rounded-full font-semibold shadow-md"
              >
                PLAYER
              </span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8 sm:py-12">
            <div class="text-4xl sm:text-5xl lg:text-6xl mb-4">🏃‍♂️</div>
            <p class="text-gray-500 text-sm sm:text-base lg:text-lg">Waiting for players to join...</p>
            <p class="text-xs sm:text-sm text-gray-400 mt-2">Share the room ID above to invite friends!</p>
          </div>

          <!-- Host Instructions -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200 mb-6">
            <div class="flex items-start gap-3">
              <div class="text-2xl sm:text-3xl">👑</div>
              <div class="flex-1">
                <h3 class="text-base sm:text-lg font-bold text-blue-800 mb-2">You're the Host!</h3>
                <ul class="space-y-1 text-xs sm:text-sm text-blue-700">
                  <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Share the Room ID with friends to invite them
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    You can start the game when ready (minimum 1 player)
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Each game has {{ totalRounds }} words to spell
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Start Game Section -->
          <div v-if="users.length > 0" class="border-t-2 border-amber-200 pt-4 sm:pt-6 lg:pt-8">
            <div class="flex flex-col gap-4">
              <div class="text-center sm:text-left">
                <p class="text-gray-600 text-sm sm:text-base lg:text-lg mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <span>🎯</span>
                  Ready to test your spelling skills?
                </p>
                <p class="text-xs sm:text-sm text-gray-500">All players will compete to spell words correctly!</p>
              </div>
              <button
                @click="handleStartGame"
                :disabled="users.length < 1"
                :class=" [
                  'w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg shadow-xl transform transition-all flex items-center justify-center gap-2 sm:gap-3',
                  users.length >= 1
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                <span>🚀</span>
                {{ users.length >= 1 ? "Start Game" : "Need Players" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Game View -->
        <div v-else class="space-y-4 sm:space-y-6">
          <!-- My Progress and Score -->
          <div class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-amber-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📈</span>
                <span class="hidden sm:inline">My Progress</span>
                <span class="sm:hidden">Progress</span>
              </h3>
              <div class="text-right">
                <p class="text-xs sm:text-sm text-gray-500">My Score</p>
                <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{{ myScore }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
              <div>
                <p class="text-sm sm:text-base lg:text-lg font-bold text-gray-800">
                  Word {{ currentRound }} of {{ totalRounds }}
                </p>
                <p class="text-xs sm:text-sm text-gray-600">
                  {{ isFinished ? 'Completed!' : 'In Progress' }}
                </p>
              </div>
              <div class="text-xl sm:text-2xl lg:text-3xl xl:text-4xl">
                {{ isFinished ? '🎉' : '📝' }}
              </div>
            </div>
          </div>

          <!-- All Players Scoreboard -->
          <div class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-amber-200">
            <h3 class="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span class="hidden sm:inline">All Players</span>
              <span class="sm:hidden">Players</span>
            </h3>
            <div class="space-y-2 sm:space-y-3">
              <div
                v-for="(user, index) in users.slice().sort((a, b) => (b.score || 0) - (a.score || 0))"
                :key="user.socketId"
                class="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2"
                :class=" [
                  user.socketId === $socket.id 
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-400' 
                    : 'bg-gray-50 border-gray-200'
                ]"
              >
                <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span class="text-base sm:text-lg lg:text-xl xl:text-2xl flex-shrink-0">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <span class="font-bold text-sm sm:text-base lg:text-lg text-gray-800 block truncate">
                      {{ user.username }}
                      {{ user.socketId === $socket.id ? ' (You - Host)' : '' }}
                    </span>
                    <p class="text-xs sm:text-sm text-gray-500">
                      Word {{ (user.currentWordIndex || 0) + 1 }} / {{ totalRounds }}
                      {{ user.isFinished ? ' - Done!' : '' }}
                    </p>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <span class="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-amber-600">{{ user.score || 0 }}</span>
                  <p class="text-xs text-gray-500">pts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Controls -->
          <div
            v-if="!isFinished"
            class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-amber-200"
          >
            <div class="text-center mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <span>🎯</span>
                Spell the Word!
              </h3>
              <p class="text-gray-600 text-sm sm:text-base">Listen carefully and type your answer</p>
              <div class="mt-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                  ✅ Correct: +10 points
                </span>
                <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                  ❌ Wrong: -5 points
                </span>
              </div>
            </div>

            <!-- Play Sound Button -->
            <div class="flex justify-center mb-6 sm:mb-8">
              <button
                @click="handlePlaySound"
                class="w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl sm:rounded-2xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 font-bold text-base sm:text-lg lg:text-xl shadow-2xl flex items-center justify-center gap-2 sm:gap-3 lg:gap-4"
              >
                <span class="text-lg sm:text-xl lg:text-2xl">🔊</span>
                Play Word {{ currentRound }}
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
                class="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg lg:text-xl xl:text-2xl border-2 border-amber-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400 focus:border-amber-500 font-mono text-center uppercase tracking-widest bg-gradient-to-r from-white to-amber-50"
              />
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                @click="handleSubmit"
                :disabled="!currentAnswer.trim()"
                :class=" [
                  'px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg shadow-lg transform transition-all flex items-center justify-center gap-2 sm:gap-3',
                  currentAnswer.trim()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                <span>✅</span>
                Submit Answer
              </button>
              <button
                @click="handleNext"
                class="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg sm:rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-bold text-sm sm:text-base lg:text-lg shadow-lg flex items-center justify-center gap-2 sm:gap-3"
              >
                <span>⏭️</span>
                Skip Word
              </button>
            </div>

            <!-- My Progress Bar -->
            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl p-4 border border-amber-200">
              <div class="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                <span>My Progress</span>
                <span>{{ Math.round((myCurrentWordIndex / totalRounds) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                <div
                  class="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  :style="{ width: `${(myCurrentWordIndex / totalRounds) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Finished State -->
          <div
            v-else
            class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-2 border-green-300 text-center"
          >
            <div class="text-4xl sm:text-5xl lg:text-6xl mb-4">🎉</div>
            <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">You're Done!</h3>
            <p class="text-gray-600 mb-4 text-sm sm:text-base">
              Final Score: <span class="font-bold text-green-600 text-base sm:text-lg lg:text-xl">{{ myScore }}</span>
            </p>
            <p class="text-xs sm:text-sm text-gray-500">Waiting for other players to finish...</p>
            <div class="mt-4 animate-pulse">
              <div class="inline-flex items-center gap-1">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0,-15px,0);
  }
  70% {
    transform: translate3d(0,-7px,0);
  }
  90% {
    transform: translate3d(0,-3px,0);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Improved gradient text for better readability */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Enhanced hover effects */
.transform:hover {
  transform: translateY(-2px);
}

/* Custom scrollbar for modal */
.max-h-\[90vh\]::-webkit-scrollbar {
  width: 4px;
}

.max-h-\[90vh\]::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.max-h-\[90vh\]::-webkit-scrollbar-thumb {
  background: #d97706;
  border-radius: 10px;
}

.max-h-\[90vh\]::-webkit-scrollbar-thumb:hover {
  background: #b45309;
}

/* Responsive utilities */
@media (max-width: 640px) {
  .border-3 {
    border-width: 2px;
  }
}

/* Ensure proper touch targets on mobile */
@media (max-width: 768px) {
  button {
    min-height: 44px;
  }
}
</style>
