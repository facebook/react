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

TODO: How to create own project

Existing Vercel project (ask Sebbie for invite):
- project: https://vercel.com/solverfox/react-fixture-view-transition/settings/build-and-deployment
- production deploy: https://react-fixture-view-transition-six.vercel.app/ there's a `-six` in the URL :(

```console
$ yarn
$ yarn build-for-vt-deploy
$ cd fixtures/view-transition
$ yarn
# Make sure you have global Vercel CLI installed e.g. `yarn global add vercel`
$ vc link
# Team: solverfox
# project: react-fixture-view-transition
$ yarn vc-build
$ yarn vc-deploy
```
