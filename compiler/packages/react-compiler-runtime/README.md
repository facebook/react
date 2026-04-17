# react-compiler-runtime

Backwards compatible shim for runtime APIs used by React Compiler. Primarily meant for React versions prior to 19, but it will also work on > 19.

## Experimental Trace Tape Prototype

This package now includes an experimental runtime-only prototype for trace-based render replay:

- `experimental_createTraceSelector(...)`
- `experimental_createRenderTraceSession(...)`

The prototype records a render-time execution tape made of:

- branch guards
- dependency selectors
- patch operations

Subsequent updates can replay only the invalidated operations instead of re-running the entire recorded render callback, until a branch guard changes and forces a full re-record.

This is intentionally a small research surface inside the compiler runtime, not a React reconciler feature.

Run the package-local benchmark with:

```sh
yarn benchmark:trace-tape
```

See also https://github.com/reactwg/react-compiler/discussions/6.
