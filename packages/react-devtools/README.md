# `react-devtools`

React DevTools is available as a built-in extension for Chrome and Firefox browsers. This package enables you to debug a React app elsewhere (e.g. a mobile browser, an embedded webview, Safari, inside an iframe).

It works both with React DOM and React Native.

<img src="http://i.imgur.com/IXeHiZD.png" width="600" alt="Screenshot of React DevTools running with React Native">

## Installation
Install the `react-devtools` package. Because this is a development tool, a global install is often the most convenient:
```sh
# Yarn
yarn global add react-devtools

# NPM
npm install -g react-devtools
```

If you prefer to avoid global installations, you can add `react-devtools` as a project dependency. With Yarn, you can do this by running:
```sh
yarn add --dev react-devtools
```

With NPM you can just use [NPX](https://www.npmjs.com/package/npx):
```sh
npx react-devtools
```

## Usage with React Native
Run `react-devtools` from the terminal to launch the standalone DevTools app:
```sh
react-devtools
```

If you're not in a simulator then you also need to run the following in a command prompt:
```sh
adb reverse tcp:8097 tcp:8097
```

If you're using React Native 0.43 or higher, it should connect to your simulator within a few seconds.

### Integration with React Native Inspector

You can open the [in-app developer menu](https://facebook.github.io/react-native/docs/debugging.html#accessing-the-in-app-developer-menu) and choose "Show Inspector". It will bring up an overlay that lets you tap on any UI element and see information about it:

![React Native Inspector](http://i.imgur.com/ReFhREb.gif)

However, when `react-devtools` is running, Inspector will enter a special collapsed mode, and instead use the DevTools as primary UI. In this mode, clicking on something in the simulator will bring up the relevant components in the DevTools:

![React DevTools Inspector Integration](http://i.imgur.com/wVgV9RP.gif)

You can choose "Hide Inspector" in the same menu to exit this mode.

### Inspecting Component Instances

When debugging JavaScript in Chrome, you can inspect the props and state of the React components in the browser console.

First, follow the [instructions for debugging in Chrome](https://facebook.github.io/react-native/docs/debugging.html#chrome-developer-tools) to open the Chrome console.

Make sure that the dropdown in the top left corner of the Chrome console says `debuggerWorker.js`. **This step is essential.**

Then select a React component in React DevTools. There is a search box at the top that helps you find one by name. As soon as you select it, it will be available as `$r` in the Chrome console, letting you inspect its props, state, and instance properties.

![React DevTools Chrome Console Integration](http://i.imgur.com/Cpvhs8i.gif)


## Usage with React DOM

The standalone shell can also be useful with React DOM (e.g. to debug apps in Safari or inside of an iframe).

Run `react-devtools` from the terminal to launch the standalone DevTools app:
```sh
react-devtools
```

Add `<script src="http://localhost:8097"></script>` as the very first `<script>` tag in the `<head>` of your page when developing:

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="http://localhost:8097"></script>
```

This will ensure the developer tools are connected. **Don’t forget to remove it before deploying to production!**

>If you install `react-devtools` as a project dependency, you may also replace the `<script>` suggested above with a JavaScript import (`import 'react-devtools'`). It is important that this import comes before any other imports in your app (especially before `react-dom`). Make sure to remove the import before deploying to production, as it carries a large DevTools client with it. If you use Webpack and have control over its configuration, you could alternatively add `'react-devtools'` as the first item in the `entry` array of the development-only configuration, and then you wouldn’t need to deal either with `<script>` tags or `import` statements.

## Advanced

By default DevTools listen to port `8097` on `localhost`. If you need to customize host, port, or other settings, see the `react-devtools-core` package instead.

## Developing

* Run `yarn start:backend` and `yarn start:standalone` in `../react-devtools-core`
* Run `yarn start` in this folder
* Refresh the app after it has recompiled a change
* For React Native, copy `react-devtools-core` to its `node_modules` to test your changes.