# Manual Testing Fixtures

This folder exists for **React contributors** only.  
If you use React, you don't need to worry about it.

These fixtures verify that the built React distributions are usable in different environments.  
**They are not running automatically.** (At least not yet. Feel free to contribute to automate them.)

Run them when you make changes to how we package React and ReactDOM.

## How to Run

First, build React and the fixtures:

```
cd react
npm run build
node fixtures/packaging/build-all.js
```

Then run a local server, e.g.

```
npx pushstate-server .
```

and open the following URL in your browser: [http://localhost:9000/fixtures/packaging/index.html](http://localhost:9000/fixtures/packaging/index.html)

You should see two things:

* A number of iframes (corresponding to various builds), with "Hello World" rendered in each iframe.
* No errors in the console.
