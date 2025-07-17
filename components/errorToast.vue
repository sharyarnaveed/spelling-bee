<template>
  <div
    class="fixed top-4 right-4 z-50 transform transition-all duration-300 animate-slide-in"
  >
    <div class="relative overflow-hidden rounded-2xl p-6 min-w-80 max-w-md">
      <div
        class="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 opacity-90"
      ></div>
      <div
        class="absolute inset-0 rounded-2xl shadow-2xl shadow-red-500/50 hover:shadow-red-400/60 transition-all duration-500"
      ></div>
      <div
        class="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
      ></div>
      <div class="relative z-10 flex items-center justify-between text-white">
        <div class="flex items-center">
          <div class="relative mr-4">
            <div
              class="absolute inset-0 bg-white/20 rounded-full blur-sm animate-pulse"
            ></div>
            <div
              class="relative bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-2 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-white animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="font-bold text-lg mb-1">Oops!</div>
            <div class="text-white/90 text-sm leading-relaxed">
              {{ message }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden"
      >
        <div
          class="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-b-2xl animate-progress"
        ></div>
      </div>
    </div>

    <div
      class="absolute -top-2 -right-2 text-red-300 animate-bounce opacity-60"
      style="animation-delay: 0s"
    >
      ⚠️
    </div>
    <div
      class="absolute -bottom-2 -left-2 text-red-300 animate-pulse opacity-40"
      style="animation-delay: 1s"
    >
      ❌
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: String,
});
</script>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.animate-progress {
  animation: progress 4s linear;
}

/* Glow effect on hover */
.group:hover .absolute {
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
}
</style>
