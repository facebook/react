# React Release Scripts

At a high-level, the release process uses two scripts: **build** and **publish**.
1. The **build** script does the heavy lifting (e.g., checking CI, running automated tests, building Rollup bundles) and then prints instructions for manual verification.
1. The **publish** script then publishes the built artifacts to npm and pushes to GitHub.

Run either script without parameters to see its usage, e.g.:
```
./scripts/release/build.js
./scripts/release/publish.js
```

Each script will guide the release engineer through any necessary steps (including environment setup and manual testing steps).
