# View Transition

A test case for View Transitions.

## Setup

To reference a local build of React, first run `npm run build` at the root
of the React project. Then:

```
cd fixtures/view-transition
yarn
yarn start
```

The `start` command runs a webpack dev server and a server-side rendering server in development mode with hot reloading.

**Note: whenever you make changes to React and rebuild it, you need to re-run `yarn` in this folder:**

```
yarn
```

If you want to try the production mode instead run:

```
yarn start:prod
```

This will pre-build all static resources and then start a server-side rendering HTTP server that hosts the React app and service the static resources (without hot reloading).

## Deploy

Deployed to https://react-fixture-view-transition-six.vercel.app
Dashboard: https://vercel.com/react-fixtures/react-fixture-view-transition.

Ask a member of React Core team for access if you need it.
Deployments should be public and happen automatically on PRs except those only targetting `compiler/`.
