# Review: compiler/crates/react_compiler/src/entrypoint/plugin_options.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts`

## Summary
The Rust `plugin_options.rs` defines `PluginOptions`, `CompilerTarget`, `GatingConfig`, `DynamicGatingConfig`, and `CompilerOutputMode`. The TS `Options.ts` defines `PluginOptions`, `ParsedPluginOptions`, `CompilerReactTarget`, `CompilationMode`, `CompilerOutputMode`, `LoggerEvent`, `Logger`, `PanicThresholdOptions`, and the `parsePluginOptions` / `parseTargetConfig` functions. The Rust version is a simplified subset since options are pre-parsed/resolved by the JS shim before being sent to Rust.

## Major Issues
None.

## Moderate Issues

1. **Missing `sources` field**: The TS `PluginOptions` has a `sources: Array<string> | ((filename: string) => boolean) | null` field. The Rust `PluginOptions` has no `sources` field. Instead, the JS shim pre-resolves this into the `should_compile` boolean. However, the `shouldSkipCompilation` logic in `Program.ts` checks `sources` at runtime against the filename, and the Rust version skips this check entirely (relying on the JS shim). If the shim does not correctly pre-resolve this, files could be incorrectly compiled.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:37:1`

2. **Missing `logger` field**: The TS `PluginOptions` has a `logger: Logger | null` field with `logEvent` and `debugLogIRs` callbacks. The Rust version has no logger field. Instead, events are collected in `ProgramContext.events` and returned as part of `CompileResult`. This is an architectural difference, not a bug.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:37:1`

3. **Missing `enableReanimatedCheck` field**: The TS has `enableReanimatedCheck: boolean`. The Rust has `enable_reanimated: bool`. The TS field name is `enableReanimatedCheck` while Rust uses `enable_reanimated`. The semantics differ -- in TS, `enableReanimatedCheck` controls whether to detect reanimated and apply compatibility, while `enable_reanimated` in Rust is the pre-resolved result of that detection. This name difference could cause confusion.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:40:1`

## Minor Issues

1. **`CompilerTarget` vs `CompilerReactTarget`**: The TS uses `CompilerReactTarget` as the type name. The Rust uses `CompilerTarget`. Minor naming difference.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:7:1`

2. **`GatingConfig` vs `ExternalFunction`**: In the TS, gating uses `ExternalFunction` type which has `source: string` and `importSpecifierName: string`. The Rust `GatingConfig` has the same fields. The naming difference (`GatingConfig` vs `ExternalFunction`) may cause confusion when cross-referencing.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:20:1`

3. **`DynamicGatingConfig` is simplified**: The TS `DynamicGatingOptions` is validated with Zod schema `z.object({ source: z.string() })`. The Rust `DynamicGatingConfig` has the same shape but uses serde deserialization instead of Zod.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:28:1`

4. **No `parsePluginOptions` or `parseTargetConfig`**: The TS has extensive option parsing/validation with Zod schemas. The Rust relies on serde deserialization with defaults and assumes the JS shim has already validated. This is expected since the JS shim pre-resolves options.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:37:1`

5. **Default values match**: `compilation_mode` defaults to `"infer"`, `panic_threshold` defaults to `"none"`, `target` defaults to `Version("19")`, `flow_suppressions` defaults to `true`. These all match the TS `defaultOptions`.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:71:1`

6. **`CompilerOutputMode::from_opts` logic**: The Rust implementation checks `output_mode` string then falls back to `no_emit` boolean, defaulting to `Client`. The TS equivalent in `Program.ts` is `pass.opts.outputMode ?? (pass.opts.noEmit ? 'lint' : 'client')`. Logic is equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:97:1`

## Architectural Differences

1. **Pre-resolved options**: The Rust `PluginOptions` is designed to be deserialized from JSON sent by the JS shim, with options pre-resolved. The TS `PluginOptions` is a Partial type that gets parsed into `ParsedPluginOptions`. The Rust version combines both concepts.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:36:1`

2. **`should_compile` and `is_dev` are Rust-specific**: These are pre-resolved by the JS shim and don't exist in the TS `PluginOptions`. `should_compile` replaces the `sources` field check. `is_dev` may be used for dev-mode-specific behavior.
   `/compiler/crates/react_compiler/src/entrypoint/plugin_options.rs:39:1`

## Missing TypeScript Features

1. **`Logger` type and `debugLogIRs` callback**: Not ported (events are batched and returned).
2. **`parsePluginOptions` function**: Not needed (JS shim pre-parses).
3. **`parseTargetConfig` function**: Not needed.
4. **Zod validation schemas**: Not needed.
5. **`CompilationMode` enum**: Represented as a `String` in Rust instead of a typed enum.
6. **`PanicThresholdOptions` enum**: Represented as a `String` in Rust instead of a typed enum.
