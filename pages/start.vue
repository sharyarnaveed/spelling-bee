<script setup>
import { useRouter } from 'vue-router'
import { useStoreWordsTore } from '~/store/Wordsstore'
const router = useRouter()

const difficulties = [
  {
    level: 'Beginner',
    description: 'Start your spelling adventure with simple words',
    icon: '🌱',
    bgPattern: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/50',
    hoverGlow: 'hover:shadow-emerald-400/60',
    features: ['3-5 letter words', 'Basic vocabulary', 'Friendly hints'],
    difficulty: 1
  },
  {
    level: 'Intermediate',
    description: 'Challenge yourself with moderately complex words',
    icon: '🏆',
    bgPattern: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600',
    glowColor: 'shadow-purple-500/50',
    hoverGlow: 'hover:shadow-purple-400/60',
    features: ['6-8 letter words', 'Mixed vocabulary', 'Moderate hints'],
    difficulty: 2
  },
  {
    level: 'Advanced',
    description: 'Master level spelling for true champions',
    icon: '🎯',
    bgPattern: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-600',
    glowColor: 'shadow-red-500/50',
    hoverGlow: 'hover:shadow-red-400/60',
    features: ['9+ letter words', 'Complex vocabulary', 'Minimal hints'],
    difficulty: 3
  }
]

const selectDifficulty = (level) => {
  console.log(`Selected difficulty: ${level}`)
  router.push(`/game?difficulty=${level.toLowerCase()}`)
}

const wordsStore = useStoreWordsTore();


onMounted(()=>
{
wordsStore.cleararray()
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="relative inline-block mb-8">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
          <div class="relative bg-gradient-to-r from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl">
            <span class="text-4xl animate-bounce">🐝</span>
          </div>
        </div>
        
        <h1 class="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-orange-300 mb-6 tracking-tight">
          SPELLING BEE
        </h1>
        
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
          <p class="text-xl md:text-2xl text-white/90 font-medium">
            Choose your difficulty level and buzz into action! 🚀
          </p>
        </div>
      </div>

      <!-- Difficulty Selection -->
      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        <div 
          v-for="(difficulty, index) in difficulties" 
          :key="difficulty.level"
          class="group relative cursor-pointer transform transition-all duration-700 hover:scale-105"
          @click="selectDifficulty(difficulty.level)"
        >
          <!-- Card Background -->
          <div class="relative overflow-hidden rounded-3xl p-8 h-full">
            <!-- Gradient Background -->
            <div :class="`absolute inset-0 ${difficulty.bgPattern} opacity-90 transition-all duration-500 group-hover:opacity-100`"></div>
            
            <!-- Glow Effect -->
            <div :class="`absolute inset-0 rounded-3xl shadow-2xl ${difficulty.glowColor} ${difficulty.hoverGlow} transition-all duration-500 group-hover:shadow-3xl`"></div>
            
            <!-- Glass Overlay -->
            <div class="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20"></div>
            
            <!-- Content -->
            <div class="relative z-10 text-center text-white h-full flex flex-col">
              <!-- Difficulty Indicator -->
              <div class="flex justify-center mb-4">
                <div class="flex space-x-1">
                  <div 
                    v-for="i in 3" 
                    :key="i"
                    :class="`w-3 h-3 rounded-full transition-all duration-300 ${
                      i <= difficulty.difficulty 
                        ? 'bg-white shadow-lg' 
                        : 'bg-white/30'
                    }`"
                  ></div>
                </div>
              </div>
              
              <!-- Icon -->
              <div class="text-8xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                {{ difficulty.icon }}
              </div>
              
              <!-- Title -->
              <h2 class="text-3xl md:text-4xl font-bold mb-4 tracking-wide">
                {{ difficulty.level }}
              </h2>
              
              <!-- Description -->
              <p class="text-white/90 text-lg mb-8 leading-relaxed flex-grow">
                {{ difficulty.description }}
              </p>
              
              <!-- Features -->
              <div class="space-y-3 mb-8">
                <div 
                  v-for="(feature, featureIndex) in difficulty.features" 
                  :key="feature"
                  class="flex items-center justify-center text-sm font-medium transform transition-all duration-300"
                  :style="`animation-delay: ${featureIndex * 0.1}s`"
                >
                  <div class="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
                  {{ feature }}
                </div>
              </div>
              
              <!-- Select Button -->
              <button 
                class="relative bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/30 hover:border-white/50 rounded-2xl py-4 px-8 font-bold text-lg transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl"
                @click.stop="selectDifficulty(difficulty.level)"
              >
                <span class="relative z-10">START {{ difficulty.level.toUpperCase() }}</span>
                <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="text-center">
        <button 
          @click="router.push('/')"
          class="group relative inline-flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-white/50 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          <svg class="w-6 h-6 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Home
        </button>
      </div>
    </div>

    <!-- Floating Elements -->
    <div class="fixed top-20 left-20 text-6xl animate-bounce opacity-20" style="animation-delay: 0s;">🌟</div>
    <div class="fixed top-40 right-32 text-4xl animate-pulse opacity-20" style="animation-delay: 1s;">✨</div>
    <div class="fixed bottom-32 left-40 text-5xl animate-bounce opacity-20" style="animation-delay: 2s;">🎯</div>
    <div class="fixed bottom-20 right-20 text-4xl animate-pulse opacity-20" style="animation-delay: 3s;">🏆</div>
    <div class="fixed top-1/2 left-10 text-3xl animate-bounce opacity-20" style="animation-delay: 4s;">🚀</div>
  </main>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.group:hover .text-8xl {
  animation: float 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.4); }
}

.shadow-3xl {
  box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
}
</style>