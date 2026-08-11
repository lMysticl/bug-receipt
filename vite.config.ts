import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'publish-agent-artifacts',
      async closeBundle() {
        await copyFile(
          resolve('skills/bug-receipt/references/receipt.schema.json'),
          resolve('dist/receipt.schema.json'),
        )
      },
    },
  ],
  base: '/bug-receipt/',
})
