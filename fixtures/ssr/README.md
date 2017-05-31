# SSR Fixtures

A set of test cases for quickly identifying issues with server-side rendering.

## Setup

To reference a local build of React, first run `npm run build` at the root
of the React project. Then:

```
cd fixtures/ssr
npm install
npm start
```

The `start` command runs a webpack dev server and a server-side rendering server in development mode with hot reloading.

If you want to try the production mode instead run:

```
npm run start:prod
```

This will pre-build all static resources and then start a server-side rendering HTTP server that hosts the React app and service the static resources (without hot reloading).
