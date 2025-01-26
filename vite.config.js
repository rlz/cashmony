import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    root: './front',
    server: {
        port: 3000,
        strictPort: true
    }
})
