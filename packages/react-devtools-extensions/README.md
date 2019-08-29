This is the source code for the React DevTools browser extension.

## Installation

The easiest way to install this extension is as a browser add-on:
* [Chrome web store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)
* [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

## Development

You can also build and install this extension from source.

DevTools embeds local versions of several NPM packages also in this workspae. If you have not already built them, you'll need to do that before getting started by running the following command in the root directory of this repository:
```sh
yarn build -- react,react-dom,react-is,scheduler --type=NODE
```

Once the above packages have been built, you can build the extension by running:
```sh
cd packages/react-devtools-extensions/

yarn build:chrome # => packages/react-devtools-extensions/chrome/build
yarn run test:chrome # Test Chrome extension

yarn build:firefox # => packages/react-devtools-extensions/firefox/build
yarn run test:firefox # Test Firefox extension
```
