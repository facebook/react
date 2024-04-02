# react_napi

This crate uses [napi-rs](https://napi.rs/) to expose React Compiler's analysis to JavaScript via the [Node-API](https://nodejs.org/api/n-api.html#node-api).

## Build

Note that `napi-rs` is a bit finicky and doesn't offer full control over where its outputs are emitted. For consistency, be sure to build with

```
yarn build
```

To use the canonical build, which will ensure that all files are placed in the right location.