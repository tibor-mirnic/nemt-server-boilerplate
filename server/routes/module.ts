import { Server } from '../core/server';
import { RoutingModule } from '../core/express/routing-module';

import { AuthRouter } from './administration/auth';
import { UserRouter } from './administration/users';

export class RoutesModule extends RoutingModule {
  authRouter: AuthRouter;
  userRouter: UserRouter;

  constructor(server: Server) {
    super(server, '/api');

    this.authRouter = new AuthRouter(this.server);
    this.userRouter = new UserRouter(this.server);
  }

  build() {
    this.server.app.use(`${ this.baseUrl }/auth`, this.authRouter.build());
    this.server.app.use(`${ this.baseUrl }/users`, this.userRouter.build());
  }
}
