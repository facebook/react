# React Release Script

At a high-level, the new release script runs in 2 passes: **build** and **publish**. The **build** script does the heavy lifting (eg checking CI, running automated tests, building Rollup bundles) and then prints instructions for manual verification. The **release** script then publishes the built artifacts to NPM and pushes to GitHub.

Run a script without any parameters to see its usage, eg:
```
node ./build.js
```