import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const pdfkitNodeEntry = fileURLToPath(
  new URL('./server/node_modules/pdfkit/js/pdfkit.node.mjs', import.meta.url)
)

const fontkitNodeEntry = fileURLToPath(
  new URL('./server/node_modules/fontkit/dist/module.mjs', import.meta.url)
)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'worker' } }),
  ],

  environments: {
  worker: {
    resolve: {
      alias: [
        {
          find: /^pdfkit$/,
          replacement: pdfkitNodeEntry,
        },
        {
          find: /^fontkit$/,
          replacement: fontkitNodeEntry,
        },
      ],
      conditions: [
        'workerd',
        'worker',
        'node',
        'module',
        'development|production',
      ],
      mainFields: ['module', 'main'],
    },
    build: {
      sourcemap: true,
    },
  },
},

  server: {
    proxy: {
      '/api': {
        target:
          process.env.VERIFYIT_API_PROXY ??
          'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
})
