This is the source code for the React DevTools browser extension.

## Installation

The easiest way to install this extension is as a browser add-on:
* [Chrome web store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)
* [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

## Development

You can also build and install this extension from source.

DevTools depends on local versions of several NPM packages also in this workspace. If you have not already built them, you'll need to do that before getting started by running the following command in the root directory of this repository:
```sh
RELEASE_CHANNEL=experimental \
  yarn build \
    -- react/index,react-dom,react-is,react-debug-tools,scheduler \
    --type=NODE
```
If you would like to skip generating a local build, you can also download the latest experimental release from CI instead:
```sh
./scripts/release/download-experimental-build.js
```
Note that at this time, an _experimental_ build is required because DevTools depends on the `createRoot` API.

Once the above packages have been built, you can build the extension by running:
```sh
cd packages/react-devtools-extensions/

yarn build:chrome # => packages/react-devtools-extensions/chrome/build
yarn run test:chrome # Test Chrome extension

yarn build:firefox # => packages/react-devtools-extensions/firefox/build
yarn run test:firefox # Test Firefox extension
```
