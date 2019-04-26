import { Server } from './core/server';

const run = async () => {
  try {
    await Server.bootstrap();
  } catch (error) {
    console.log(error);
  }
};

run();
