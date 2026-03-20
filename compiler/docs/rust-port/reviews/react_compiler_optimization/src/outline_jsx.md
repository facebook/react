# Review: react_compiler_optimization/src/outline_jsx.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/OutlineJsx.ts`

## Summary
This is a stub implementation. The full OutlineJsx pass is not yet implemented. The TS version is approximately 400+ lines implementing complex JSX extraction logic.

## Major Issues

### Incomplete Implementation
- **Rust (lines 1-25)**: The entire file is a no-op stub with a TODO comment
- **TS (lines 34-100+)**: Full implementation with JSX instruction collection, prop analysis, destructuring generation, outlined function creation, and more
- **Impact**: JSX outlining feature is not functional in Rust port
- **Reason**: Per TODO comment (lines 20-22), the full implementation requires creating new HIRFunctions, destructuring props, rewriting JSX instructions, and running DCE, which requires further infrastructure

## Moderate Issues
None (since the feature is not implemented)

## Minor Issues
None

## Architectural Differences
None relevant since this is a stub

## Missing from Rust Port
Everything. The TypeScript version includes:
- JSX instruction collection and grouping
- Children tracking
- Global load tracking
- Prop extraction and analysis
- Outlined function HIR construction
- Prop destructuring generation
- JSX instruction rewriting
- Dead code elimination integration
- Environment.outlineFunction() integration

## Additional in Rust Port
None
