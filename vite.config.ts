import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'PUBLIC_'],
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter({ pages: 'dist', assets: 'dist', precompress: true, fallback: '404.html' }),
    }),
  ],
});
