\### React DevTools Extensions Build Error: Module Not Found – React



\### Issue Type



This issue is \*\*not related to the React Compiler or its associated tooling\*\*. Specifically, it is:



\- Not related to `React Compiler core`

\- Not related to `babel-plugin-react-compiler`

\- Not related to `eslint-plugin-react-compiler`

\- Not related to `react-compiler-healthcheck`



\*\*This is a monorepo build configuration issue.\*\*



The error arises due to running installation or build commands in a sub-package (`react-devtools-extensions`) instead of the root of the Yarn Workspaces-based monorepo.



---



\### Reproduction Steps



To reproduce the issue:



```bash

\# Step 1: Navigate into the devtools extensions package

cd packages/react-devtools-extensions



\# Step 2: Install dependencies (incorrect context)

yarn install



\# Step 3: Attempt to build the Chrome extension

yarn build:chrome

```

Resulting Error (truncated sample)



`Module not found: Error: Can't resolve 'react' in '/Users/username/Desktop/react-main/packages/react-devtools-shared/src/devtools/views/Settings'

`





This error is repeated across multiple files and packages such as:



\- react-devtools-shared



\- react-devtools-timeline



\- react-devtools-core



\*\*Root Cause\*\*

The React GitHub repository is organized as a monorepo using Yarn Workspaces. Dependencies like react are declared at the root level and hoisted across sub-packages.



When you run yarn install from inside a sub-package, Yarn does not hoist or link shared dependencies correctly. As a result, sub-packages that depend on hoisted modules like react fail to resolve them during the build process.



\### Correct Solution

\*\*Step 1: Navigate to the Root of the Repository\*\*



`cd /Users/bytedance/Desktop/react-main`





\*\*Step 2: Install All Dependencies from the Monorepo Root\*\*



`yarn install`



This ensures all dependencies—including react—are correctly linked across all sub-packages via Yarn Workspaces.



\*\*Step 3: Build the Chrome Extension\*\*



`yarn build:chrome`



\*\*Alternatively, if you want to build just the devtools extension:\*\*



`yarn build react-devtools-extensions`

