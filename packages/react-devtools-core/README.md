# `react-devtools-core`

This package provides low-level APIs to support renderers like [React Native](https://github.com/facebook/react-native). If you're looking for the standalone React DevTools UI, **we suggest using [`react-devtools`](https://github.com/facebook/react/tree/main/packages/react-devtools) instead of using this package directly**.

This package provides two entrypoints: labeled "backend" and "standalone" (frontend). Both APIs are described below.

# Backend API

Backend APIs are embedded in _development_ builds of renderers like [React Native](https://github.com/facebook/react-native) in order to connect to the React DevTools UI.

### Example

If you are building a non-browser-based React renderer, you can use the backend API like so:

```js
if (process.env.NODE_ENV !== 'production') {
  const { connectToDevTools } = require("react-devtools-core");

  // Must be called before packages like react or react-native are imported
  connectToDevTools({
    ...config
  });
}
```

> **NOTE** that this API (`connectToDevTools`) must be (1) run in the same context as React and (2) must be called before React packages are imported (e.g. `react`, `react-dom`, `react-native`).

### `connectToDevTools` options
| Prop | Default | Description |
|---|---|---|
| `host` | `"localhost"` | Socket connection to frontend should use this host. |
| `isAppActive` |  | (Optional) function that returns true/false, telling DevTools when it's ready to connect to React. |
| `port` | `8097` | Socket connection to frontend should use this port. |
| `resolveRNStyle` |  | (Optional) function that accepts a key (number) and returns a style (object); used by React Native. |
| `retryConnectionDelay` | `200` | Delay (ms) to wait between retrying a failed Websocket connection |
| `useHttps` | `false` | Socket connection to frontend should use secure protocol (wss). |
| `websocket` |  | Custom `WebSocket` connection to frontend; overrides `host` and `port` settings. |

# Frontend API

Frontend APIs can be used to render the DevTools UI into a DOM node. One example of this is [`react-devtools`](https://github.com/facebook/react/tree/main/packages/react-devtools) which wraps DevTools in an Electron app.

### Example
```js
import DevtoolsUI from "react-devtools-core/standalone";

// See the full list of API methods in documentation below.
const { setContentDOMNode, startServer } = DevtoolsUI;

// Render DevTools UI into a DOM element.
setContentDOMNode(document.getElementById("container"));

// Start socket server used to communicate between backend and frontend.
startServer(
  // Port defaults to 8097
  1234,

  // Host defaults to "localhost"
  "example.devserver.com",

  // Optional config for secure socket (WSS).
  {
    key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
    cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
  }
);
```

### Exported methods
The `default` export is an object defining the methods described below.

These methods support chaining for convenience. For example:
```js
const DevtoolsUI = require("react-devtools-core/standalone");
DevtoolsUI.setContentDOMNode(element).startServer();
```

#### `connectToSocket(socket: WebSocket)`
> This is an advanced config function that is typically not used.

Custom `WebSocket` connection to use for communication between DevTools frontend and backend. Calling this method automatically initializes the DevTools UI (similar to calling `startServer()`).

#### `openProfiler()`
Automatically select the "Profiler" tab in the DevTools UI.

#### `setContentDOMNode(element: HTMLElement)`
Set the DOM element DevTools UI should be rendered into on initialization.

#### `setDisconnectedCallback(callback: Function)`
_Optional_ callback to be notified when DevTools `WebSocket` closes (or errors).

#### `setProjectRoots(roots: Array<string>)`
_Optional_ set of root directores for source files. These roots can be used to open an inspected component's source code using an IDE.

#### `setStatusListener(callback: Function)`
_Optional_ callback to be notified of socket server events (e.g. initialized, errored, connected).

This callback receives two parameters:
```js
function onStatus(
  message: string,
  status: 'server-connected' | 'devtools-connected' | 'error'
): void {
  // ...
}
```

#### `startServer(port?: number, host?: string, httpsOptions?: Object, loggerOptions?: Object)`
Start a socket server (used to communicate between backend and frontend) and renders the DevTools UI.

This method accepts the following parameters:
| Name | Default | Description |
|---|---|---|
| `port` | `8097` | Socket connection to backend should use this port. |
| `host` | `"localhost"` | Socket connection to backend should use this host. |
| `httpsOptions` | | _Optional_ object defining `key` and `cert` strings. |
| `loggerOptions` | | _Optional_ object defining a `surface` string (to be included with DevTools logging events). |

# Development

Watch for changes made to the backend entry point and rebuild:
```sh
yarn start:backend
```

Watch for changes made to the standalone UI entry point and rebuild:
```sh
yarn start:standalone
```

Run the standalone UI using `yarn start` in the [`react-devtools`](https://github.com/facebook/react/tree/main/packages/react-devtools).