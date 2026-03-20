# Review: react_compiler/src/entrypoint/mod.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/index.ts`

## Summary
Module declaration file that correctly exposes all entrypoint submodules and re-exports key types.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
None.

## Architectural Differences
Uses Rust `pub mod` and `pub use` instead of ES6 exports.

## Missing from Rust Port
None.

## Additional in Rust Port
None.
