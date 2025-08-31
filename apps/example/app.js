import { MiGPT } from '@mi-gpt/next';
import config from './config.js';

// Gracefully shutdown
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => process.exit(0));
}

async function main() {
  try {
    await MiGPT.start(config);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
