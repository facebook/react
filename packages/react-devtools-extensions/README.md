This is the source code for the React DevTools browser extension.

## Installation

The easiest way to install this extension is as a browser add-on:
* [Chrome web store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)
* [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

## Development

You can also build and install from source:
```sh
yarn install

cd packages/react-devtools-extensions/

yarn build:chrome # => packages/react-devtools-extensions/chrome/build
yarn run test:chrome # Test Chrome extension

yarn build:firefox # => packages/react-devtools-extensions/firefox/build
yarn run test:firefox # Test Firefox extension
```
