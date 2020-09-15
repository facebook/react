# `react-devtools-core`

A standalone React DevTools implementation.

This is a low-level package. If you're looking for the Electron app you can run, **use `react-devtools` package instead.**

## API

### `react-devtools-core`

This is similar requiring the `react-devtools` package, but provides several configurable options. Unlike `react-devtools`, requiring `react-devtools-core` doesn't connect immediately but instead exports a function:

```js
const { connectToDevTools } = require("react-devtools-core");
connectToDevTools(config);
```

Run `connectToDevTools()` in the same context as React to set up a connection to DevTools.  
Be sure to run this function *before* importing e.g. `react`, `react-dom`, `react-native`.

The `config` object may contain:
* `host: string` (defaults to "localhost") - Websocket will connect to this host.
* `port: number` (defaults to `8097`) - Websocket will connect to this port.
* `useHttps: boolean` (defaults to `false`) - Websocked should use a secure protocol (wss).
* `websocket: Websocket` - Custom websocket to use. Overrides `host` and `port` settings if provided.
* `resolveRNStyle: (style: number) => ?Object` - Used by the React Native style plug-in.
* `isAppActive: () => boolean` - If provided, DevTools will poll this method and wait until it returns true before connecting to React.

## `react-devtools-core/standalone`

Renders the DevTools interface into a DOM node.

```js
require("react-devtools-core/standalone")
  .setContentDOMNode(document.getElementById("container"))
  .setStatusListener(status => {
    // This callback is optional...
  })
  .startServer(port);
```

Renders DevTools interface into a DOM node over SSL using a custom host name (Default is localhost).

```js
const host = 'dev.server.com';
const options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};


require("react-devtools-core/standalone")
  .setContentDOMNode(document.getElementById("container"))
  .setStatusListener(status => {
    // This callback is optional...
  })
  .startServer(port, host, options);
```

Reference the `react-devtools` package for a complete integration example.

## Development

Watch for changes made to the backend entry point and rebuild:
```sh
yarn start:backend
```

Watch for changes made to the standalone UI entry point and rebuild:
```sh
yarn start:standalone
```
