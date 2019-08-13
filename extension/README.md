This repo is a work-in-progress rewrite of the [React DevTools extension](https://github.com/facebook/react-devtools). A demo of the beta extension can be found online at [react-devtools-experimental.now.sh](https://react-devtools-experimental.now.sh/).

# Installation

Installation instructions are available online as well:
* [Chrome](https://react-devtools-experimental-chrome.now.sh/)
* [Firefox](https://react-devtools-experimental-firefox.now.sh/)

Or you can build and install from source:
```sh
git clone git@github.com:bvaughn/react-devtools-experimental.git

cd react-devtools-experimental

yarn install

yarn build:extension:chrome # builds at "shells/browser/chrome/build"
yarn build:extension:firefox # builds at "shells/browser/firefox/build"
```

# Support

As this extension is in a beta period, it is not officially supported. However if you find a bug, we'd appreciate you reporting it as a [GitHub issue](https://github.com/bvaughn/react-devtools-experimental/issues/new) with repro instructions.