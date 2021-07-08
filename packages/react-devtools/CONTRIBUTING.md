Intrested in contributing to React DevTools, but not sure where to start? This is the place!

# Install project dependencies
To get started, check out the React repo:
```sh
git clone git@github.com:facebook/react.git
```
Next install dependencies:
```sh
cd <react-repo>

yarn install

cd scripts/release
yarn install
```

# Build React and React DOM
Next, check out (or build) the local version of React that DevTools uses:

### Option 1 (fastest): Checkout pre-built React
To check out the latest version of React (built by CI from the `main` branch) run:
```sh
cd <react-repo>
scripts/release/download-experimental-build.js --commit=main
```

### Option 2: Build from source
If your DevTools change includes local changes to React (or if CI is down for some reason) you can also build from source:
```sh
cd <react-repo>
yarn build-for-devtools
```

# Testing your changes

### Option 1 (fastest): Using the test shell
Most changes can be tested using the DevTools test app. To run this, you'll need two terminals:

First, run DevTools in DEV mode:
```sh
cd <react-repo>
cd packages/react-devtools-inline
yarn start
```
Next, run the test shell:
```sh
cd <react-repo>
cd packages/react-devtools-shell
yarn start
```
Now any changes you make to DevTools will automatically reload in the test app at http://localhost:8080

### Option 2: Using the extension
Some changes requiring testing in the browser extension (e.g. like "named hooks"). To do this, run the following script:
```sh
cd <react-repo>
cd packages/react-devtools-extensions
yarn build:chrome && yarn test:chrome
```
This will launch a standalone version of Chrome with the locally built React DevTools pre-installed. If you are testing a specific URL, you can make your testing even faster by passing the `--url` argument to the test script:
```sh
yarn build:chrome && yarn test:chrome --url=<url-to-test>
```

# Finding the right first issue
The React team maintains [this list of "good first issues"](https://github.com/facebook/react/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22Component%3A+Developer+Tools%22+label%3A%22good+first+issue%22) for anyone interested in contributing to DevTools. If you see one that interests you, leave a comment!
