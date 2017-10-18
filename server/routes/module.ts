import { Server } from './../core/server';
import { RoutingModule } from './../core/express/routing-module';

import { UserRouter } from './administration/users';

export class RoutesModule extends RoutingModule {
  userRouter: UserRouter;

  constructor(server: Server) {
    super(server, '/api');

    this.userRouter = new UserRouter(this.server);
  }

  build() {
    this.server.app.use(`${this.baseUrl}/users`, this.userRouter.build());
  }
}