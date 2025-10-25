<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useStoreScores } from '~/store/Score.store'
import { useStoreWordsTore } from '~/store/Wordsstore'

const router = useRouter()
const showSignInPopup = ref(false);
const isAuthenticated = ref(false);
const user = ref(null);
const isClient = ref(false);

// Use the useAppwrite function
const { account } = useAppwrite();

const difficulties = [
  {
    level: 'Beginner',
    description: 'Start your spelling adventure with simple words',
    icon: '🌱',
    bgPattern: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/50',
    hoverGlow: 'hover:shadow-emerald-400/60',
    features: ['5 letter words', 'Basic vocabulary', 'Friendly hints'],
    difficulty: 1
  },
  {
    level: 'Intermediate',
    description: 'Challenge yourself with moderately complex words',
    icon: '🏆',
    bgPattern: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600',
    glowColor: 'shadow-purple-500/50',
    hoverGlow: 'hover:shadow-purple-400/60',
    features: ['5 letter words', 'Mixed vocabulary', 'Moderate hints'],
    difficulty: 2
  },
  {
    level: 'Advanced',
    description: 'Master level spelling for true champions',
    icon: '🎯',
    bgPattern: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-600',
    glowColor: 'shadow-red-500/50',
    hoverGlow: 'hover:shadow-red-400/60',
    features: ['5 letter words', 'Complex vocabulary', 'Minimal hints'],
    difficulty: 3
  }
]

// Check authentication status
const checkAuthStatus = async () => {
  try {
    const currentUser = await account.get();
    if (currentUser) {
      isAuthenticated.value = true;
      user.value = currentUser;
      showSignInPopup.value = false; // Close popup when authenticated
      return true;
    }
  } catch (error) {
    isAuthenticated.value = false;
    user.value = null;
    return false;
  }
};

// Google Sign-In function
const signInWithGoogle = async () => {
  try {
    // Use your domain for success/failure URLs
    const baseUrl = window.location.origin;
    await account.createOAuth2Session(
      'google',
      `${baseUrl}/start?auth=success`, // Success URL
      `${baseUrl}/start?auth=failed`   // Failure URL
    );
  } catch (error) {
    console.error('Google sign-in error:', error);
    showSignInPopup.value = false; // Close popup on error
  }
};

// Sign out function
const signOut = async () => {
  try {
    await account.deleteSession('current');
    isAuthenticated.value = false;
    user.value = null;
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

const closeSignInPopup = () => {
  showSignInPopup.value = false;
};

const checkAuthAndProceed = (action, level = null) => {
  if (!isAuthenticated.value) {
    showSignInPopup.value = true;
    return;
  }
  
  if (action === 'game' && level) {
    selectDifficulty(level);
  } else if (action === 'multiplayer') {
    router.push('/multiplayer');
  }
};

const selectDifficulty = (level) => {
  if (!isAuthenticated.value) {
    showSignInPopup.value = true;
    return;
  }
  console.log(`Selected difficulty: ${level}`)
  router.push(`/game?difficulty=${level.toLowerCase()}`)
}

const handleMultiplayer = () => {
  if (!isAuthenticated.value) {
    showSignInPopup.value = true;
    return;
  }
  router.push('/multiplayer');
};

// Handle OAuth callback
const handleOAuthCallback = async () => {
  const route = useRoute();
  
  // Check if this is an OAuth callback
  if (route.query.auth === 'success') {
    // Show loading state briefly
    console.log('OAuth success detected, checking auth status...');
    
    // Wait a moment for session to be established, then check multiple times
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkWithRetry = async () => {
      attempts++;
      const isAuth = await checkAuthStatus();
      
      if (isAuth) {
        console.log('Authentication confirmed');
        showSignInPopup.value = false;
        // Remove auth query parameter from URL
        await router.replace('/start');
      } else if (attempts < maxAttempts) {
        console.log(`Auth check attempt ${attempts} failed, retrying...`);
        setTimeout(checkWithRetry, 1000);
      } else {
        console.error('Failed to authenticate after multiple attempts');
        showSignInPopup.value = false;
        await router.replace('/start');
      }
    };
    
    setTimeout(checkWithRetry, 500);
    
  } else if (route.query.auth === 'failed') {
    console.error('OAuth authentication failed');
    showSignInPopup.value = false;
    // Remove auth query parameter from URL
    await router.replace('/start');
  }
};

const wordsStore = useStoreWordsTore();
const Scorestore = useStoreScores();

// Watch for authentication changes to ensure popup closes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    showSignInPopup.value = false;
  }
});

onMounted(async () => {
  isClient.value = true;
  
  // Handle OAuth callback first
  await handleOAuthCallback();
  
  // Then check auth status if not already authenticated
  if (!isAuthenticated.value) {
    await checkAuthStatus();
  }
  
  wordsStore.cleararray();
  Scorestore.clear();
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
    <!-- Animated Background Elements - Only show when not authenticated -->
    <div v-if="!isAuthenticated" class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    </div>

    <!-- Static Background Elements - Show when authenticated -->
    <div v-if="isAuthenticated" class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Sign In Popup - Only render on client -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="showSignInPopup && isClient" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-md w-full shadow-2xl relative">
            <!-- Close button -->
            <button @click="closeSignInPopup" class="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">
              ✕
            </button>
            
            <div class="text-center">
              <div class="mb-6">
                <div class="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <span class="text-2xl">🐝</span>
                </div>
                <h3 class="text-2xl font-bold text-white mb-2">Sign In Required</h3>
                <p class="text-white/80">Please sign in to start playing Spelling Bee</p>
              </div>
              
              <button @click="signInWithGoogle" 
                class="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- User Info Bar (when authenticated) - Only render on client -->
    <ClientOnly>
      <div v-if="isAuthenticated && isClient" class="absolute top-4 right-4 z-20">
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-semibold">{{ user?.name?.charAt(0) || 'U' }}</span>
          </div>
          <span class="text-white text-sm">{{ user?.name || user?.email }}</span>
          <button @click="signOut" class="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-all">
            Sign Out
          </button>
        </div>
      </div>
    </ClientOnly>

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="relative inline-block mb-8">
          <div v-if="!isAuthenticated" class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
          <div v-if="isAuthenticated" class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50"></div>
          <div class="relative bg-gradient-to-r from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl">
            <span class="text-4xl" :class="{ 'animate-bounce': !isAuthenticated }">🐝</span>
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
          @click="checkAuthAndProceed('game', difficulty.level)"
        >
        
          <div class="relative overflow-hidden rounded-3xl p-8 h-full">
         
            <div :class="`absolute inset-0 ${difficulty.bgPattern} opacity-90 transition-all duration-500 group-hover:opacity-100`"></div>
            
      
            <div :class="`absolute inset-0 rounded-3xl shadow-2xl ${difficulty.glowColor} ${difficulty.hoverGlow} transition-all duration-500 group-hover:shadow-3xl`"></div>
            
          
            <div class="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20"></div>
            
           
            <div class="relative z-10 text-center text-white h-full flex flex-col">
          
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
              
            
              <h2 class="text-3xl md:text-4xl font-bold mb-4 tracking-wide">
                {{ difficulty.level }}
              </h2>
              
           
              <p class="text-white/90 text-lg mb-8 leading-relaxed flex-grow">
                {{ difficulty.description }}
              </p>
              
            
              <div class="space-y-3 mb-8">
                <div 
                  v-for="(feature, featureIndex) in difficulty.features" 
                  :key="feature"
                  class="flex items-center justify-center text-sm font-medium transform transition-all duration-300"
                  :style="`animation-delay: ${featureIndex * 0.1}s`"
                >
                  <div class="w-2 h-2 bg-white rounded-full mr-3" :class="{ 'animate-pulse': !isAuthenticated }"></div>
                  {{ feature }}
                </div>
              </div>
              
             
              <button 
                class="relative bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/30 hover:border-white/50 rounded-2xl py-4 px-8 font-bold text-lg transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl"
                @click.stop="checkAuthAndProceed('game', difficulty.level)"
              >
                <span class="relative z-10">START {{ difficulty.level.toUpperCase() }}</span>
                <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Multiplayer Button -->
      <div class="flex justify-center mb-12">
        <button
          @click="handleMultiplayer"
          class="group relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:scale-105 hover:shadow-2xl transition-all duration-300 rounded-3xl py-6 px-12 font-bold text-2xl text-white shadow-xl border-2 border-white/30 hover:border-white/50"
        >
          <span class="flex items-center space-x-3">
            <span class="text-4xl" :class="{ 'animate-bounce': !isAuthenticated }">🤝</span>
            <span>MULTIPLAYER</span>
          </span>
          <div class="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

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

    <!-- Decorative Elements - Only animate when not authenticated -->
    <div v-if="!isAuthenticated" class="fixed top-20 left-20 text-6xl animate-bounce opacity-20" style="animation-delay: 0s;">🌟</div>
    <div v-if="!isAuthenticated" class="fixed top-40 right-32 text-4xl animate-pulse opacity-20" style="animation-delay: 1s;">✨</div>
    <div v-if="!isAuthenticated" class="fixed bottom-32 left-40 text-5xl animate-bounce opacity-20" style="animation-delay: 2s;">🎯</div>
    <div v-if="!isAuthenticated" class="fixed bottom-20 right-20 text-4xl animate-pulse opacity-20" style="animation-delay: 3s;">🏆</div>
    <div v-if="!isAuthenticated" class="fixed top-1/2 left-10 text-3xl animate-bounce opacity-20" style="animation-delay: 4s;">🚀</div>
    
    <!-- Static Decorative Elements when authenticated -->
    <div v-if="isAuthenticated" class="fixed top-20 left-20 text-6xl opacity-10">🌟</div>
    <div v-if="isAuthenticated" class="fixed top-40 right-32 text-4xl opacity-10">✨</div>
    <div v-if="isAuthenticated" class="fixed bottom-32 left-40 text-5xl opacity-10">🎯</div>
    <div v-if="isAuthenticated" class="fixed bottom-20 right-20 text-4xl opacity-10">🏆</div>
    <div v-if="isAuthenticated" class="fixed top-1/2 left-10 text-3xl opacity-10">🚀</div>
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