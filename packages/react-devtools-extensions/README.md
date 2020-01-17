This is the source code for the React DevTools browser extension.

## Installation

The easiest way to install this extension is as a browser add-on:
* [Chrome web store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)
* [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

## Local development
You can also build and install this extension from source.

### Prerequisite steps
DevTools depends on local versions of several NPM packages<sup>1</sup> also in this workspace. You'll need to either build or download those packages first.

<sup>1</sup> Note that at this time, an _experimental_ build is required because DevTools depends on the `createRoot` API.

#### Build from source
To build dependencies from source, run the following command from the root of the repository:
```sh
yarn build-for-devtools
```
#### Download from CI
To use the latest build from CI, run the following command from the root of the repository:
```sh
./scripts/release/download-experimental-build.js
```
### Build steps
Once the above packages have been built or downloaded, you can build the extension by running:
```sh
cd packages/react-devtools-extensions/

yarn build:chrome # => packages/react-devtools-extensions/chrome/build
yarn run test:chrome # Test Chrome extension

yarn build:firefox # => packages/react-devtools-extensions/firefox/build
yarn run test:firefox # Test Firefox extension
```
