<script setup>
import { Query } from "appwrite";
import { ID } from "appwrite"; // Add this import
import { useRouter } from "vue-router";

const router = useRouter();
const joinroom = ref(false);
const createroom = ref(false);
const createroomname = ref("");
const roomcode = ref("")
const username = ref("");

const { $socket } = useNuxtApp();

// Use the useAppwrite function instead of direct imports
const { databases } = useAppwrite();

// Get runtime config for environment variables
const config = useRuntimeConfig();

const displayjoinroom = () => {
  joinroom.value = true;
  createroom.value = false;
};

const displaycreateroom = () => {
  joinroom.value = false;
  createroom.value = true;
};

const createroomfunc = async () => {
  try {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();

    const responce = await databases.createDocument(
      config.public.appwriteDatabase, // Use env variable instead of hardcoded
      config.public.appwriteCollection, // Use env variable instead of hardcoded
      ID.unique(),
      {
        roomid: roomId,
        host: username.value
      }
    )
    console.log(responce);
    const theuser = username.value
    $socket.emit("create-room", {
      roomid: roomId,
      username: username.value,
    });
    const name = username.value
    localStorage.setItem("name", name)
    $socket.on("room-created", ({ roomid }) => {
      router.push(`/room/${roomid}`)
    })

  } catch (error) {
    console.log("error in creatig room", error);
  }
};


const Jointheroom = async () => {
  const responce = await databases.listDocuments(
    config.public.appwriteDatabase, // Use env variable instead of hardcoded
    config.public.appwriteCollection, // Use env variable instead of hardcoded
    [Query.equal("roomid", roomcode.value)]
  )
  const roomid = roomcode.value
  if (responce.documents[0]) {
    const name = username.value
    localStorage.setItem("name", name)

    $socket.emit("join-room", {
      roomid,
      username: name,
    });

    router.push(`/joinroom/${roomid}`)
  }
}


onMounted(() => {
  if ($socket?.on) {
    $socket.on("connect", () => {
      console.log("Connected to socket server:", $socket.id);
    });

  } else {
    console.warn("Socket not available");
  }
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 2s"></div>
      <div class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 4s"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="relative inline-block mb-8">
          <div
            class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse">
          </div>
          <div
            class="relative bg-gradient-to-r from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl">
            <span class="text-4xl animate-bounce">🐝</span>
          </div>
        </div>

        <h1
          class="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-orange-300 mb-6 tracking-tight">
          MULTIPLAYER
        </h1>

        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
          <p class="text-xl md:text-2xl text-white/90 font-medium">
            Choose your Room! 🚀
          </p>
        </div>
      </div>

      <!-- Create Room Form -->
      <div v-if="createroom" class="flex justify-center mb-12">
        <form
          class="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-xl space-y-6"
          @submit.prevent="createroomfunc">
          <div>
            <label class="block text-white font-semibold mb-2">Room Name</label>
            <input type="text" placeholder="Enter room name" v-model="createroomname"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label class="block text-white font-semibold mb-2">Your Name</label>
            <input type="text" placeholder="Enter your name" v-model="username"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button type="submit"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-300">
            Create Room
          </button>
        </form>
      </div>

      <div v-if="joinroom" class="flex justify-center mb-12">
        <form
          class="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-xl space-y-6"
          @submit.prevent="Jointheroom">
          <div>
            <label class="block text-white font-semibold mb-2">Room Code</label>
            <input type="text" v-model="roomcode" placeholder="Enter room code"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label class="block text-white font-semibold mb-2">Your Name</label>
            <input type="text" v-model="username" placeholder="Enter your name"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <button type="submit"
            class="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-300">
            Join Room
          </button>
        </form>
      </div>

      <!-- create room btn -->
      <div class="flex justify-center mb-12">
        <button @click="displaycreateroom"
          class="group relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:scale-105 hover:shadow-2xl transition-all duration-300 rounded-3xl py-6 px-12 font-bold text-2xl text-white shadow-xl border-2 border-white/30 hover:border-white/50">
          <span class="flex items-center space-x-3">
            <span class="text-4xl animate-bounce">🤝</span>
            <span>Create Room</span>
          </span>
          <div
            class="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          </div>
        </button>
      </div>

      <!-- Join Room Form -->
      <div class="flex justify-center mb-12">
        <button
          class="group relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:scale-105 hover:shadow-2xl transition-all duration-300 rounded-3xl py-6 px-12 font-bold text-2xl text-white shadow-xl border-2 border-white/30 hover:border-white/50"
          @click="displayjoinroom">
          <span class="flex items-center space-x-3">
            <span class="text-4xl animate-bounce">🤝</span>
            <span>Join Room</span>
          </span>
          <div
            class="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          </div>
        </button>
      </div>

      <div class="text-center">
        <button @click="router.push('/start')"
          class="group relative inline-flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-white/50 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
          <svg class="w-6 h-6 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18">
            </path>
          </svg>
          Back to Home
        </button>
      </div>
    </div>

    <div class="fixed top-20 left-20 text-6xl animate-bounce opacity-20" style="animation-delay: 0s">
      🌟
    </div>
    <div class="fixed top-40 right-32 text-4xl animate-pulse opacity-20" style="animation-delay: 1s">
      ✨
    </div>
    <div class="fixed bottom-32 left-40 text-5xl animate-bounce opacity-20" style="animation-delay: 2s">
      🎯
    </div>
    <div class="fixed bottom-20 right-20 text-4xl animate-pulse opacity-20" style="animation-delay: 3s">
      🏆
    </div>
    <div class="fixed top-1/2 left-10 text-3xl animate-bounce opacity-20" style="animation-delay: 4s">
      🚀
    </div>
  </main>
</template>

<style scoped>
@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.group:hover .text-8xl {
  animation: float 3s ease-in-out infinite;
}

@keyframes glow {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  }

  50% {
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.4);
  }
}

.shadow-3xl {
  box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
}
</style>
