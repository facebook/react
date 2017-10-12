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

cd fixtures/packaging
node build-all.js
```

Then run a local server at the root of the repo, e.g.

```
npm i -g pushstate-server
cd ../..
pushstate-server .
```

(Too complicated? Send a PR to simplify this :-)).

Then open the following URL in your browser:

```
open http://localhost:9000/fixtures/packaging/index.html
```

You should see two things:

* "Hello World" is rendered in each iframe.
* No errors in the console.
