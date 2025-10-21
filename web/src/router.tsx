// router.ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// export const createRouter = () =>
//   createTanStackRouter({
//     routeTree,
//     scrollRestoration: true,
//     defaultPreloadStaleTime: 0,
//   })

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  })
  return router
}
