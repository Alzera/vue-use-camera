import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      staticImport: true,
    }),
  ],
  build: {
    lib: {
      name: 'VueUseCamera',
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'use-camera': resolve(__dirname, 'src/use-camera.ts'),
        'use-take-photo': resolve(__dirname, 'src/use-take-photo.ts'),
        'use-take-video': resolve(__dirname, 'src/use-take-video.ts'),
      },
    },
    rollupOptions: {
      external: [
        'vue',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
      }
    }
  },
});