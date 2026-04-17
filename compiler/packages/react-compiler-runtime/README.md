# react-compiler-runtime

Backwards compatible shim for runtime APIs used by React Compiler. Primarily meant for React versions prior to 19, but it will also work on > 19.

## Experimental Structured Hooks Prototype

This package now includes an experimental keyed-hooks prototype:

- `experimental_createStructuredHookSession(...)`
- `experimental_useStructuredHooks(...)`

The hypothesis is that the famous “hooks must be top-level” rule is partly an implementation artifact of cursor-based hook identity. If a compiler can lower a tiny structured subset into stable keyed cells instead, then some conditional hook patterns stop being fundamentally impossible.

The current prototype is intentionally narrow:

- keyed state cells
- keyed memo cells
- dormant branch cells survive branch toggles
- duplicate keys in the same render throw
- changing a key from one hook kind to another throws

There are now two layers:

- a pure session API for isolated experiments
- a single real React hook that hosts those keyed cells inside one top-level hook call

On the paired experimental compiler branch, a tiny lowering path can also target this runtime for a very small subset of conditional `useState()` / `useMemo()` patterns.

This is still not React hook replacement. It is a proof-of-concept target for future compiler lowering experiments.

See also https://github.com/reactwg/react-compiler/discussions/6.
