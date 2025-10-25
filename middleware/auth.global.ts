export default defineNuxtRouteMiddleware(async (to) => {
  // protect /game and /multiplayer routes
  if (!to.path.startsWith('/game') && !to.path.startsWith('/multiplayer')) return


  if (process.server) return

  const { account } = useAppwrite()

  try {
    await account.get()
    return
  } catch (err) {

    return navigateTo({ path: '/start', query: { authRequired: '1', redirectTo: to.fullPath } })
  }
})