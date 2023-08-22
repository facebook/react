# eslint-browser

This package exports a webpack-bundled version of `eslint.Linter` in a way that can be consumed by other
webpack-ified code (ie, by playground). Note that the normal `eslint` package does not support being
built by WebPack. The approach used in this package is modeled closely on how ESLint's playground works.
