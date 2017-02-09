# Manual Testing Fixtures

This folder exists for **React contributors** only.  
If you use React you don't need to worry about it.

These fixtures verify that the built React distributions are usable in different environments.  
**They are not running automatically.** (At least not yet, feel free to contribute to automate them.)

Run them when you make changes to how we package React, ReactDOM, and addons.

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

(Too complicated? Send a PR to simplify this :-).

Then open the corresponding URLs, for example:

```
open http://localhost:9000/fixtures/globals.html
open http://localhost:9000/fixtures/requirejs.html
open http://localhost:9000/fixtures/systemjs.html
open http://localhost:9000/fixtures/browserify/index.html
open http://localhost:9000/fixtures/brunch/index.html
open http://localhost:9000/fixtures/rjs/index.html
open http://localhost:9000/fixtures/systemjs-builder/index.html
open http://localhost:9000/fixtures/webpack/index.html
open http://localhost:9000/fixtures/webpack-alias/index.html
```

You should see two things:

* "Hello World" fading in with an animation.
* No errors in the console.
