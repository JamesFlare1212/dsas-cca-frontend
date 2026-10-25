import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

// svelte-check's native compiler mode can retain output from deleted components.
await rm(new URL('.svelte-kit/.svelte-check/', root), { recursive: true, force: true });

const check = Bun.spawn(
  [
    process.execPath,
    '--bun',
    'svelte-check',
    '--tsgo',
    '--tsconfig',
    './tsconfig.json',
    ...process.argv.slice(2),
  ],
  { cwd: fileURLToPath(root), stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
);

process.exit(await check.exited);
