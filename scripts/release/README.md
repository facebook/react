# React Release Script

At a high-level, the release script runs in 2 passes: **build** and **publish**.
1. The **build** script does the heavy lifting (eg checking CI, running automated tests, building Rollup bundles) and then prints instructions for manual verification.
1. The **publish** script then publishes the built artifacts to NPM and pushes to GitHub.

Run either script without parameters to see its usage, eg:
```
./scripts/release/build.js
./scripts/release/publish.js
```

Each script will guide the release engineer through any necessary steps (including environment setup and manual testing steps).