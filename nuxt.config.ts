// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/global.css'],
  modules: ['@pinia/nuxt'],
   pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**'],
  },
  // Toast options should be set in a separate toast.config.js file or via runtimeConfig if supported by @nuxtjs/toast
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
})