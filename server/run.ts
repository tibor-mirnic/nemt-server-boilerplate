import { Server } from './core/server';

(async () => {
  try {
    await Server.bootstrap();
  } catch (error) {
    console.log(error);
  }
})();
