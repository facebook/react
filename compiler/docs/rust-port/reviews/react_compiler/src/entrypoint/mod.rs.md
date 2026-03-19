# Review: compiler/crates/react_compiler/src/entrypoint/mod.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/index.ts`

## Summary
The Rust `mod.rs` declares and re-exports the entrypoint sub-modules. The TS `index.ts` re-exports from all six Entrypoint sub-modules. The Rust version is structurally equivalent.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **Selective re-exports vs wildcard**: The Rust file does `pub use compile_result::*`, `pub use plugin_options::*`, `pub use program::*` but does not wildcard-re-export `gating`, `imports`, `pipeline`, or `suppression`. The TS `index.ts` does `export *` from all modules. This means consumers of the Rust crate must import from sub-modules for gating/imports/pipeline/suppression types.
   `/compiler/crates/react_compiler/src/entrypoint/mod.rs:9:1`

2. **No Reanimated module**: The TS has a `Reanimated.ts` file. The Rust has no corresponding module. This is expected (Reanimated is JS-only).
   `/compiler/crates/react_compiler/src/entrypoint/mod.rs:1:1`

## Architectural Differences
None beyond module system differences.

## Missing TypeScript Features
- `Reanimated.ts` is not ported. It depends on Babel plugin pipeline introspection and `require.resolve`, which are JS-only.
