import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Cashmony - personal finances tracker',
                short_name: 'Cashmony',
                description: 'Personal finances tracker',
                icons: [
                    {
                        src: '/favicon.svg',
                        sizes: 'any'
                    },
                    {
                        src: '/web-app-manifest-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '/web-app-manifest-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                background_color: '#121212',
                theme_color: '#121212',
                scope: '/'
            }
        })
    ],
    root: './front',
    server: {
        port: 3000,
        strictPort: true
    }
})
