# React Reconciler Test Fixture

This folder exists for **React contributors** only.
If you use React you don't need to worry about it.

These fixtures are a smoke-screen verification that the built React Reconciler distribution works.
**They are not running automatically.** (At least not yet, feel free to contribute to automate them.)

Run them when you make changes to how we package React or perform any release.

To test, from the project root:
* `yarn build`
* `pushd fixtures/reconciler; yarn install && yarn test; popd`

If everything is okay then you should see `Ok!` printed to the console.

