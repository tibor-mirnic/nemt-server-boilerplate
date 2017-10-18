# NodeJS Server #

This is a NodeJS, Express and MongoDB application written using Typescript.

Application has multiple environments:

* `local` - Default

* `test`

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
  }, {
    "type": "node",
    "request": "launch",
    "name": "Unit tests",
    "program": "${workspaceRoot}/server/tests/unit/run",
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
  }]
});
```