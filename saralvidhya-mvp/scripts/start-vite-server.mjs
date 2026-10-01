import { createServer } from 'vite';
import config from '../vite.config.js';

const server = await createServer({
  ...config,
  configFile: false,
  server: {
    ...(config.server ?? {}),
    host: '127.0.0.1',
    port: 5173,
  },
});

await server.listen();
server.printUrls();
console.log('\nKeep this window open while using the app.');
console.log('Open the Local URL above in your browser.');

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

setInterval(() => {}, 1 << 30);
