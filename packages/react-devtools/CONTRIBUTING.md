
Interested in contributing to React DevTools, but not sure where to start? This is the place!

# Install project dependencies
To get started, check out the React repo:
```sh
git clone git@github.com:facebook/react.git
```
Next install dependencies:
```sh
cd <react-repo>
yarn install
```

# Build React and React DOM
Next, check out (or build) the local version of React that DevTools uses:

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


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
yarn build:chrome:local && yarn test:chrome
```
This will launch a standalone version of Chrome with the locally built React DevTools pre-installed. If you are testing a specific URL, you can make your testing even faster by passing the `--url` argument to the test script:
```sh
yarn build:chrome && yarn test:chrome --url=<url-to-test>
```

# Unit tests
Core DevTools functionality is typically unit tested (see [here](https://github.com/facebook/react/tree/main/packages/react-devtools-shared/src/__tests__)). To run tests, you'll first need to build or download React and React DOM ([as explained above](#build-react-and-react-dom)) and then use the following NPM script:
```sh
yarn test-build-devtools
```
You can connect tests to a debugger as well if you'd like by running:
```sh
yarn debug-test-build-devtools
```

# Finding the right first issue
The React team maintains [this list of "good first issues"](https://github.com/facebook/react/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22Component%3A+Developer+Tools%22+label%3A%22good+first+issue%22) for anyone interested in contributing to DevTools. If you see one that interests you, leave a comment!

If you have ideas or suggestions of your own, you can also put together a PR demonstrating them. We suggest filing an issue before making any substantial changes though, to ensure that the idea is something the team feels comfortable landing.
