# React server rendering example

This example demonstrates how React's server rendering works. Rather than demonstrate a pure-Node solution, this example shows how an app not written in JavaScript (in this case, PHP) can utilize React's server rendering capabilities.

## Overview

You generally start a React app by doing something like this:

```javascript
React.renderComponent(MyComponent({someData: ...}), document.getElementById('someContainer'));
```

The problem is that `someContainer` will be an empty HTML element until the JavaScript downloads and executes. This is bad for page load performance (since the user can't see anything until the JS downloads and executes) and is bad for SEO (since the Googlebot can't see any content). React's server rendering solves this problem -- it lets you fill `someContainer` with *static HTML* on the server and "bring it to life" on the client *without* throwing out and re-creating the HTML.

In order to do this, you need to do a few things. You need to be able to run JavaScript on the server, and you need to be able to bundle that JavaScript code and send it down to the browser. This example provides one architecture, but there are many ways to do it.

## Architecture overview

Let's augment an existing PHP app to support server rendering. This architecture runs an Express-based Node web service to run the JavaScript server side. PHP simply uses `file_get_contents()` to send an HTTP request to this service to get the static HTML string.

Browserify is used to run the same code that Node.js is running inside of the browser (aka "isomorphic" JavaScript).

```
+-------------+       +------------------+                                              +----------------------+
|             |       |                  |  ---- HTTP request (module, props JSON) ---> |                      |
| The browser | <---> | Existing PHP App |                                              | Node.js react server |
|             |       |                  |  <--- HTTP response (static HTML string) --- |                      |
+------+------+       +------------------+                                              +----------------------+
       ^                                                                                            ^
       |                                                                                            |
       |              +------------------+                                              +-----------+----------+
       |              |                  |                                              |                      |
       +--------------+    Browserify    | <--------------------------------------------+  App code (CommonJS) |
                      |                  |                                              |                      |
                      +------------------+                                              +----------------------+
```

## How to run the demo

  * `npm install` from `jsapp/` and `reactserver/`.
  * Run `browserify` by doing `npm run build` inside `jsapp/`. This will generate a `webapp/static/bundle.js` file.
  * Run the node server by doing `npm start` inside `reactserver/`.
  * Finally, open `index.php` in your browser (on a webserver running PHP, of course). View-source to see the rendered markup.
  * Kill the `reactserver` and reload `index.php`. You'll notice that the app still works! View-source and you'll see no rendered markup. React is smart enough to recover if server rendering doesn't work.