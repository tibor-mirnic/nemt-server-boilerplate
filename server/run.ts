import { Server } from './core/server';

let run = async () => {
  try {
    await Server.bootstrap();
  } catch (error) {
    console.log(error);
  }
};

run();
