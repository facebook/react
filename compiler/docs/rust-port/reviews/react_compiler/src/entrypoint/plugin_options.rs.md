# Review: react_compiler/src/entrypoint/plugin_options.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts`

## Summary
Complete port of plugin options with simplified subset for Rust. Omits JS-only fields (logger, sources function) as intended.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Missing compilationMode field (plugin_options.rs:45 vs Options.ts:136)
**TypeScript** has `compilationMode: CompilationMode` field.
**Rust** has `compilation_mode: String` with default "infer".

Rust doesn't define CompilationMode enum. Should use enum for type safety:
```rust
pub enum CompilationMode {
    Infer,
    Syntax,
    Annotation,
    All,
}
```

### 2. Missing PanicThresholdOptions enum (plugin_options.rs:47 vs Options.ts:26-42)
**TypeScript** has `PanicThresholdOptionsSchema` zod enum.
**Rust** has `panic_threshold: String` with default "none".

Should use enum instead of String for type safety.

## Architectural Differences

### 1. Simplified options struct (plugin_options.rs:37-69)
**Intentional**: Rust version omits JS-specific fields from TypeScript:
- `logger: Logger | null` - handled separately in compile_result
- `sources: Array<string> | ((filename: string) => boolean) | null` - cannot represent function type, handled in JS shim
- `enableReanimatedCheck: boolean` - reanimated detection happens in JS

These are pre-resolved by the JS shim before calling Rust.

### 2. String types instead of enums (plugin_options.rs:46-48)
**Suboptimal**: Uses `String` for `compilation_mode` and `panic_threshold` instead of Rust enums. TypeScript uses zod enums for validation.

Should define:
```rust
pub enum CompilationMode { Infer, Syntax, Annotation, All }
pub enum PanicThreshold { AllErrors, CriticalErrors, None }
```

### 3. CompilerReactTarget enum (plugin_options.rs:7-16)
**Rust**:
```rust
pub enum CompilerTarget {
    Version(String),
    MetaInternal { kind: String, runtime_module: String },
}
```

**TypeScript** (Options.ts:186-201):
```typescript
z.union([
  z.literal('17'),
  z.literal('18'),
  z.literal('19'),
  z.object({
    kind: z.literal('donotuse_meta_internal'),
    runtimeModule: z.string().default('react'),
  }),
])
```

Rust version is more permissive (accepts any String for Version). TypeScript enforces literal values '17', '18', '19'. This is acceptable for Rust - validation happens in TS.

## Missing from Rust Port

### 1. CompilationMode and PanicThreshold enums
TypeScript has strong enums via zod. Rust uses String types. See minor issues above.

### 2. JS-specific fields (intentionally omitted):
- `logger: Logger | null`
- `sources: Array<string> | ((filename: string) => boolean) | null`
- `enableReanimatedCheck: boolean`

These are handled in the JS shim layer.

### 3. Default option values and validation (Options.ts:304-322)
TypeScript has `defaultOptions` object and `parsePluginOptions` function. Rust relies on serde defaults and expects pre-validated options from JS.

## Additional in Rust Port

### 1. should_compile and enable_reanimated fields (plugin_options.rs:39-40, 42)
Pre-resolved boolean flags from JS shim. TypeScript computes these dynamically.

**Purpose**: Simplifies Rust logic - all JS-side decisions made upfront.

### 2. Serde integration (plugin_options.rs:5-6, 37, 45-69)
Uses serde for JSON deserialization from JS shim. TypeScript doesn't need this.

### 3. CompilerOutputMode enum (plugin_options.rs:88-105)
Separate enum with `from_opts` constructor. TypeScript uses inline string literals.

More type-safe Rust approach.
