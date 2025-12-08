import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          // TipTap editor and extensions
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-blockquote',
            '@tiptap/extension-bold',
            '@tiptap/extension-bullet-list',
            '@tiptap/extension-code',
            '@tiptap/extension-code-block',
            '@tiptap/extension-code-block-lowlight',
            '@tiptap/extension-document',
            '@tiptap/extension-hard-break',
            '@tiptap/extension-heading',
            '@tiptap/extension-history',
            '@tiptap/extension-horizontal-rule',
            '@tiptap/extension-italic',
            '@tiptap/extension-list-item',
            '@tiptap/extension-ordered-list',
            '@tiptap/extension-paragraph',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-strike',
            '@tiptap/extension-table',
            '@tiptap/extension-task-item',
            '@tiptap/extension-task-list',
            '@tiptap/extension-text',
            '@tiptap/extension-typography',
          ],
          // Syntax highlighting
          'vendor-lowlight': ['lowlight'],
          // Drag and drop
          'vendor-dnd': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
          // Utilities
          'vendor-utils': ['date-fns', 'marked', 'turndown', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});

