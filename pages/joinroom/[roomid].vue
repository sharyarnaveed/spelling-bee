<script setup>
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const { $socket } = useNuxtApp();

const roomid = route.params.roomid;
const users = ref([]);
const isConnecting = ref(true);
const connectionError = ref('');
const gameStarted = ref(false);
const currentAnswer = ref('');
const currentRound = ref(1);
const totalRounds = ref(10);

onMounted(() => {
  const username = localStorage.getItem("name");
  
  if (!username) {
    router.push('/');
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
});

const leaveRoom = () => {
  $socket.emit("leave-room", { roomid });
  router.push('/');
};

const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomid);
    // You could add a toast notification here
    alert('Room ID copied!');
  } catch (err) {
    console.error('Failed to copy room ID:', err);
  }
};

const handleStartGame = () => {
  gameStarted.value = true;
  // Emit socket event to start game for all players
  $socket.emit("start-game", { roomid });
};

const handlePlaySound = () => {
  // Emit socket event to play word sound
  $socket.emit("play-word", { roomid });
  console.log('Playing word sound...');
};

const handleSubmit = () => {
  if (currentAnswer.value.trim()) {
    // Emit socket event to submit answer
    $socket.emit("submit-answer", { 
      roomid, 
      answer: currentAnswer.value.trim() 
    });
    console.log('Submitted answer:', currentAnswer.value);
    currentAnswer.value = '';
  }
};

const handleNext = () => {
  // Emit socket event to move to next word
  $socket.emit("next-word", { roomid });
  currentRound.value = Math.min(currentRound.value + 1, totalRounds.value);
  currentAnswer.value = '';
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
    <div class="max-w-6xl mx-auto">
      
      <!-- Connecting State -->
      <div v-if="isConnecting" class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-6"></div>
          <p class="text-gray-600 text-lg">Connecting to room...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="connectionError" class="flex items-center justify-center min-h-screen">
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
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        <!-- Lobby View -->
        <div v-if="!gameStarted" class="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-200">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Players in Room
              <span class="text-lg text-gray-500 font-normal">({{ users.length }}/2)</span>
            </h2>
            <div class="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-green-700 font-semibold">Connected</span>
            </div>
          </div>

          <!-- Players Grid -->
          <div v-if="users.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div 
              v-for="(user, index) in users" 
              :key="user.socketId"
              class="bg-gradient-to-br from-amber-50 to-yellow-50 border-3 border-amber-300 rounded-2xl p-8 text-center transform transition-all hover:scale-105 shadow-lg"
            >
              <div class="text-6xl mb-4">
                {{ index === 0 ? '👑' : '👤' }}
              </div>
              <p class="font-bold text-2xl text-gray-800 mb-1">{{ user.username }}</p>
              <span v-if="index === 0" class="inline-block px-3 py-1 bg-amber-500 text-white text-xs rounded-full font-semibold">
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
                <p class="text-gray-600 text-lg mb-2">
                  🎯 Ready to test your spelling skills?
                </p>
                <p class="text-sm text-gray-500">
                  Share the room ID with friends to invite them!
                </p>
              </div>
              <button 
                @click="handleStartGame"
                :disabled="users.length < 2"
                :class="[
                  'px-8 py-4 rounded-xl font-bold text-lg shadow-xl transform transition-all flex items-center gap-3',
                  users.length >= 2
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                {{ users.length >= 2 ? 'Start Game' : 'Need 2+ Players' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Game View -->
        <div v-else class="space-y-6">
          <!-- Scoreboard -->
          <div class="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold text-gray-800">📊 Scoreboard</h3>
              <div class="text-right">
                <p class="text-sm text-gray-500">Round</p>
                <p class="text-2xl font-bold text-amber-600">{{ currentRound }} / {{ totalRounds }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div 
                v-for="(user, index) in users" 
                :key="user.socketId"
                class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-300"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{{ index === 0 ? '👑' : '👤' }}</span>
                    <span class="font-bold text-lg text-gray-800">{{ user.username }}</span>
                  </div>
                  <span class="text-2xl font-bold text-amber-600">{{ user.score || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Controls -->
          <div class="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-200">
            <div class="text-center mb-8">
              <h3 class="text-3xl font-bold text-gray-800 mb-2">🎯 Spell the Word!</h3>
              <p class="text-gray-600">Listen carefully and type your answer</p>
            </div>

            <!-- Play Sound Button -->
            <div class="flex justify-center mb-8">
              <button 
                @click="handlePlaySound"
                class="px-12 py-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 font-bold text-xl shadow-2xl flex items-center gap-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Play Word Sound
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
                :class="[
                  'px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all flex items-center justify-center gap-3',
                  currentAnswer.trim()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Submit Answer
              </button>
              <button 
                @click="handleNext"
                class="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-bold text-lg shadow-lg flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
                Skip / Next
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="mt-8">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{{ Math.round((currentRound / totalRounds) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  class="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
                ></div>
              </div>
            </div>
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