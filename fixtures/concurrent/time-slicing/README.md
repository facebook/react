# CPU async rendering demo

## What is this fixture?

This is a demo application based on [Dan Abramov's](https://github.com/gaearon) recent [JSConf Iceland talk](https://reactjs.org/blog/2018/03/01/sneak-peek-beyond-react-16.html) about React.

It depends on a local build of React and enables us to easily test async "time slicing" APIs in a more "real world app" like context.

## Can I use this code in production?

No. The APIs being tested here are unstable and some of them have still not been released to NPM. For now, this fixture is only a test harness.

There are also known bugs and inefficiencies in master so **don't use this fixture for demonstration purposes either yet**. Until they are fixed, this fixture is **not** indicative of React async rendering performance.

## How do I run this fixture?

```shell
# 1: Build react from source
cd /path/to/react
yarn
yarn build react-dom/index,react/index,react-cache,scheduler --type=NODE

# 2: Install fixture dependencies
cd fixtures/unstable-async/time-slicing/
yarn

# 3: Run the app
yarn start
```
