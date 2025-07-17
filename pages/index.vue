<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <main class="mainsection relative min-h-screen flex items-center justify-center px-8 md:px-12">
    <div class="absolute inset-0 bg-black bg-opacity-40"></div>
    <div class="relative z-10 text-center text-white max-w-4xl mx-auto">
      <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight drop-shadow-lg">
        Welcome to the Buzz <br class="hidden sm:block"> 
        <span class="text-yellow-400">of Learning!</span>
      </h1>
      <button 
        @click="router.push('/start')"
        class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Start Your Journey
      </button>
    </div>
  </main>
</template>

<style scoped>
.mainsection {
  background-image: url("/public/mainimage.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>