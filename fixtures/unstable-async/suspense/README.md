# IO "suspense" demo

## What is this fixture?

This is a demo application based on [Dan Abramov's](https://github.com/gaearon) recent [JSConf Iceland talk](https://reactjs.org/blog/2018/03/01/sneak-peek-beyond-react-16.html) about React.

It depends on a local build of React and enables us to easily test async and "suspense" APIs in a more "real world app" like context.

## Can I use this code in production?

No. The APIs being tested here are unstable and some of them have still not been released to NPM. For now, this fixture is only a test harness.

## How do I run this fixture?

Clone the React repository.

First, open this file locally:

* `packages/shared/ReactFeatureFlags.js` (make sure you didn't open a similarly named file!)

Set [the `enableSuspense` flag](https://github.com/facebook/react/blob/d79238f1eeb6634ba7a3df23c3b2709b56cbb8b2/packages/shared/ReactFeatureFlags.js#L19) to `true` and save the file.

**After you've done that,** follow these steps:

```shell
# 1: Build react from source
cd /path/to/react
yarn
yarn build dom-client,core,react-cache,schedule --type=NODE

# 2: Install fixture dependencies
cd fixtures/unstable-async/suspense/
yarn

# 3: Run the app
yarn start
```
