# NodeJS Server #

This is a NodeJS, Express and MongoDB application written using Typescript.

Application has multiple environments:

* `local` - Default

* `development`

# Visual Studio Code #

To run application using `debugger` you need this configuration:

```
"configurations": [
  {
    "type": "node",
    "request": "launch",
    "name": "Debug server",
    "program": "${workspaceRoot}/server/run",
    "cwd": "${workspaceRoot}/server"
  }
]
```

# Command line #

Running the application:

`npm run start` or `NODE_ENV=local ts-node run.ts`

Windows environment:

`npm run start-windows` or  `SET NODE_ENV=local&& ts-node run.ts`

# Database #

Before running the application you need to add a database user to the mongo instance.

You can find the database user credentials in the `config/enviornments/your_environment`.

```
use 'database_name';
db.createUser({
  user: 'user',
  pwd: 'password',
  roles: [{
    role: 'readWrite',
    db: 'database_name'
  }],
  passwordDigestor: "server"
});
```

# Server Structure #

<pre>
  .
  ├── <b>config</b>
    ├── <b>environments</b> - Environment specific configuration
    ├── <b>keys</b> - Keys and certs for HTTPS
    └── <b>constants.ts</b> - Application wide constants
  ├── <b>core</b>
    ├── <b>auth</b> - Express passport and strategies
    ...
    ├── <b>db</b>
      ├── <b>db-context.ts</b> - Wrapper class for Moongoose connection
      └── <b>factory.ts</b> - Wrapper class for Mongoose model
    ├── <b>error</b> - Applicaiton wide error classes
    ├── <b>express</b>
      ├── <b>router.ts</b> - Wrapper class for Express.Router
      └── <b>routing-module.ts</b> - Group express routes under same url
    ├── <b>extensions</b>
      ├── <b>audit-info.ts</b> - Static class used to apply audit info to Mongoose model
      ├── <b>mongoose.ts</b> - Mongoose schema interfaces
      └── <b>repository.ts</b> - Repository helper
    ├── <b>handlers</b>
      ├── <b>error</b> - Global Express error handler
      └── <b>success</b> - Global Express success handler
    ├── <b>models</b> - Used for defining core models, not database models
    ├── <b>util</b> - Application utils
    ├── <b>environment.ts</b> - Application environment util class
    ├── <b>logger.ts</b> - Winston logger wrapper
    ├── <b>repository.ts</b> - Mongoose model wrapper
    └── <b>server.ts</b> - Application and express middleware init
  ├── <b>db</b>
    ├── <b>models</b> - Database models, each model has interface, schema definition and factory
    ├── <b>static</b> - Static database modles
    └── <b>factories.ts</b> - Factory builder, define all factories used in the app
  ├── <b>private</b>
    ├── <b>log</b>
      ├── <b>server</b> - Server errors saved on daily basis
      └── <b>http</b> - Morgan http requests
    └── <b>tmp</b> - Temp folder
  ├── <b>repositories</b> - Mongoose model wrappers
  ├── <b>routes</b> - Express routes
    └── <b>module.ts</b> - Group express routes under same url
    ...
</pre>
