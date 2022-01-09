# `react-devtools-inline`

React DevTools implementation for embedding within a browser-based IDE (e.g. [CodeSandbox](https://codesandbox.io/), [StackBlitz](https://stackblitz.com/)).

This is a low-level package. If you're looking for the standalone DevTools app, **use the `react-devtools` package instead.**

## Usage

This package exports two entry points: a frontend (to be run in the main `window`) and a backend (to be installed and run within an `iframe`<sup>1</sup>).

The frontend and backend can be initialized in any order, but **the backend must not be activated until the frontend initialization has completed**. Because of this, the simplest sequence is:

1. Frontend (DevTools interface) initialized in the main `window`.
1. Backend initialized in an `iframe`.
1. Backend activated.

<sup>1</sup> Sandboxed iframes are supported.

## API

### `react-devtools-inline/backend`

* **`initialize(contentWindow)`** -
Installs the global hook on the window. This hook is how React and DevTools communicate. **This method must be called before React is loaded.**<sup>2</sup>
* **`activate(contentWindow)`** -
Lets the backend know when the frontend is ready. It should not be called until after the frontend has been initialized, else the frontend might miss important tree-initialization events.

```js
import { activate, initialize } from 'react-devtools-inline/backend';

// This should be the iframe the React application is running in.
const iframe = document.getElementById(frameID);
const contentWindow = iframe.contentWindow;

// Call this before importing React (or any other packages that might import React).
initialize(contentWindow);

// Initialize the frontend...

// Call this only once the frontend has been initialized.
activate(contentWindow);
```

<sup>2</sup> The backend must be initialized before React is loaded. (This means before any `import` or `require` statements or `<script>` tags that include React.)

### `react-devtools-inline/frontend`

* **`initialize(contentWindow)`** -
Configures the DevTools interface to listen to the `window` the backend was injected into. This method returns a React component that can be rendered directly<sup>3</sup>.

```js
import { initialize } from 'react-devtools-inline/frontend';

// This should be the iframe the backend hook has been installed in.
const iframe = document.getElementById(frameID);
const contentWindow = iframe.contentWindow;

// This returns a React component that can be rendered into your app.
// e.g. render(<DevTools {...props} />);
const DevTools = initialize(contentWindow);
```

<sup>3</sup> Because the DevTools interface makes use of several new React APIs (e.g. suspense, concurrent mode) it should be rendered using either `ReactDOM.createRoot` or `ReactDOM.createSyncRoot`. **It should not be rendered with `ReactDOM.render`.**

## Examples

### Supporting named hooks

DevTools can display hook "names" for an inspected component, although determining the "names" requires loading the source (and source-maps), parsing the code, and inferring the names based on which variables hook values get assigned to. Because the code for this is non-trivial, it's lazy-loaded only if the feature is enabled.

To configure this package to support this functionality, you'll need to provide a prop that dynamically imports the extra functionality:
```js
// Follow code examples above to configure the backend and frontend.
// When rendering DevTools, the important part is to pass a 'hookNamesModuleLoaderFunction' prop.
const hookNamesModuleLoaderFunction = () => import('react-devtools-inline/hookNames');

// Render:
<DevTools
  hookNamesModuleLoaderFunction={hookNamesModuleLoaderFunction}
  {...otherProps}
/>;
```

### Configuring a same-origin `iframe`

The simplest way to use this package is to install the hook from the parent `window`. This is possible if the `iframe` is not sandboxed and there are no cross-origin restrictions.

```js
import {
  activate as activateBackend,
  initialize as initializeBackend
} from 'react-devtools-inline/backend';
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend';

// The React app you want to inspect with DevTools is running within this iframe:
const iframe = document.getElementById('target');
const { contentWindow } = iframe;

// Installs the global hook into the iframe.
// This must be called before React is loaded into that frame.
initializeBackend(contentWindow);

// Initialize DevTools UI to listen to the hook we just installed.
// This returns a React component we can render anywhere in the parent window.
// This also must be called before React is loaded into the iframe
const DevTools = initializeFrontend(contentWindow);

// React application can be injected into <iframe> at any time now...
// Note that this would need to be done via <script> tag injection,
// as setting the src of the <iframe> would load a new page (without the injected backend).

// <DevTools /> interface can be rendered in the parent window at any time now...
// Be sure to use either ReactDOM.createRoot()
// or ReactDOM.createSyncRoot() to render this component.

// Let the backend know the frontend is ready and listening.
activateBackend(contentWindow);
```

### Configuring a sandboxed `iframe`

Sandboxed `iframe`s are also supported but require more complex initialization.

**`iframe.html`**
```js
import { activate, initialize } from "react-devtools-inline/backend";

// The DevTools hook needs to be installed before React is even required!
// The safest way to do this is probably to install it in a separate script tag.
initialize(window);

// Wait for the frontend to let us know that it's ready.
function onMessage({ data }) {
  switch (data.type) {
    case "activate-backend":
      window.removeEventListener("message", onMessage);

      activate(window);
      break;
    default:
      break;
  }
}

window.addEventListener("message", onMessage);
```

**`main-window.html`**
```js
import { initialize } from "react-devtools-inline/frontend";

const iframe = document.getElementById("target");
const { contentWindow } = iframe;

// Initialize DevTools UI to listen to the iframe.
// This returns a React component we can render anywhere in the main window.
// Be sure to use either ReactDOM.createRoot()
// or ReactDOM.createSyncRoot() to render this component.
const DevTools = initialize(contentWindow);

// Let the backend know to initialize itself.
// We can't do this directly because the iframe is sandboxed.
// Only initialize the backend once the DevTools frontend has been initialized.
iframe.onload = () => {
  contentWindow.postMessage(
    {
      type: "activate-backend"
    },
    "*"
  );
};
```

### Advanced integration with custom "wall"

Below is an example of an advanced integration with a website like [Replay.io](https://replay.io/) or Code Sandbox's Sandpack (where more than one DevTools instance may be rendered per page).

```js
import {
  activate as activateBackend,
  createBridge as createBackendBridge,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend';
import {
  createBridge as createFrontendBridge,
  createStore,
  initialize as createDevTools,
} from 'react-devtools-inline/frontend';

// DevTools uses "message" events and window.postMessage() by default,
// but we can override this behavior by creating a custom "Wall" object.
// For example...
const wall = {
  _listeners: [],
  listen(listener) {
    wall._listeners.push(listener);
  },
  send(event, payload) {
    wall._listeners.forEach(listener => listener({event, payload}));
  },
};

// Initialize the DevTools backend before importing React (or any other packages that might import React).
initializeBackend(contentWindow);

// Prepare DevTools for rendering.
// To use the custom Wall we've created, we need to also create our own "Bridge" and "Store" objects.
const bridge = createFrontendBridge(contentWindow, wall);
const store = createStore(bridge);
const DevTools = createDevTools(contentWindow, { bridge, store });

// You can render DevTools now:
const root = createRoot(container);
root.render(<DevTools {...otherProps} />);

// Lastly, let the DevTools backend know that the frontend is ready.
// To use the custom Wall we've created, we need to also pass in the "Bridge".
activateBackend(contentWindow, {
  bridge: createBackendBridge(contentWindow, wall),
});
```

Alternately, if your code can't share the same `wall` object, you can still provide a custom Wall that connects a specific DevTools frontend to a specific backend like so:
```js
const uid = "some-unique-string-shared-between-both-pieces";
const wall = {
  listen(listener) {
    window.addEventListener("message", (event) => {
      if (event.data.uid === uid) {
        listener(event.data);
      }
    });
  },
  send(event, payload) {
    window.postMessage({ event, payload, uid }, "*");
  },
};
```

## Local development
You can also build and test this package from source.

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
Once the above packages have been built or downloaded, you can watch for changes made to the source code and automatically rebuild by running:
```sh
yarn start
```

To test package changes, refer to the [`react-devtools-shell` README](https://github.com/facebook/react/blob/main/packages/react-devtools-shell/README.md).
