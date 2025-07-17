<template>
  <div
    class="fixed top-0 left-0 w-full z-40"
  >
    <div class="relative mx-auto max-w-2xl mt-8">
      <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 opacity-90 rounded-2xl blur-sm"></div>
      <div class="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-yellow-200/30"></div>
      <div class="relative z-10 flex items-center justify-center py-6 px-8">
        <span class="text-3xl md:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
          <span class="animate-bounce">🐝</span>
          Game Begins! Buzz into action!
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed for static banner
</script>

<style scoped>
/* Optional: Add a subtle entrance animation */
@keyframes banner-in {
  from {
    opacity: 0;
    transform: translateY(-40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.relative {
  animation: banner-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>