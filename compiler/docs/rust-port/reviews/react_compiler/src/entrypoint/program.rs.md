# Review: react_compiler/src/entrypoint/program.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts`

## Summary
Partial port of program compilation entrypoint. Core structure present but many functions are stubs or simplified. This is expected as the full pipeline is not yet ported.

## Major Issues

### 1. Missing function discovery logic (program.rs:118-237 vs Program.ts:490-559)
**TypeScript** `findFunctionsToCompile` has full traversal logic to discover components/hooks.
**Rust** version is highly simplified - just calls `fixture_utils::extract_function`.

**TypeScript** (Program.ts:490-559):
```typescript
function findFunctionsToCompile(
  program: NodePath<t.Program>,
  pass: CompilerPass,
  programContext: ProgramContext,
): Array<CompileSource> {
  const queue: Array<CompileSource> = [];
  const traverseFunction = (fn: BabelFn, pass: CompilerPass): void => {
    // Complex logic to determine if function should be compiled
    // Checks compilation mode, function type, skip/already compiled
    const fnType = getReactFunctionType(fn, pass);
    if (fnType === null || programContext.alreadyCompiled.has(fn.node)) return;
    programContext.alreadyCompiled.add(fn.node);
    fn.skip();
    queue.push({kind: 'original', fn, fnType});
  };
  program.traverse({
    ClassDeclaration(node) { node.skip(); },
    ClassExpression(node) { node.skip(); },
    FunctionDeclaration: traverseFunction,
    FunctionExpression: traverseFunction,
    ArrowFunctionExpression: traverseFunction,
  }, {...});
  return queue;
}
```

**Rust** (program.rs:118-237):
```rust
fn find_functions_to_compile(
    ast: &File,
    opts: &PluginOptions,
    context: &ProgramContext,
) -> Vec<CompileSource> {
    // Simplified: just extracts one function from fixture
    let fn_count = fixture_utils::count_top_level_functions(ast);
    // ... stub logic
    vec![]
}
```

**Impact**: Cannot actually discover React components/hooks in real programs. Only works for test fixtures with explicit function extraction.

### 2. Missing getReactFunctionType logic (program.rs vs Program.ts:818-864)
TypeScript has sophisticated logic to determine if a function is a Component/Hook/Other:
- Checks for opt-in directives
- Detects component/hook syntax (declarations)
- Infers from name + JSX/hook usage
- Validates component params
- Handles forwardRef/memo callbacks

Rust version doesn't have this - relies on fixture test harness to specify function type.

### 3. Missing gating application (program.rs:258-309 vs Program.ts:738-780)
**TypeScript** (Program.ts:761-770):
```typescript
const functionGating = dynamicGating ?? pass.opts.gating;
if (kind === 'original' && functionGating != null) {
  referencedBeforeDeclared ??=
    getFunctionReferencedBeforeDeclarationAtTopLevel(program, compiledFns);
  insertGatedFunctionDeclaration(
    originalFn, transformedFn, programContext,
    functionGating, referencedBeforeDeclared.has(result),
  );
} else {
  originalFn.replaceWith(transformedFn);
}
```

**Rust** (program.rs:258-309):
```rust
fn apply_compiled_functions(...) {
    for result in compiled_fns {
        // TODO: apply gating if configured
        // TODO: replace original function with compiled version
        // For now, this is a stub that will be implemented when
        // AST mutation is added to the Rust compiler
    }
}
```

**Impact**: Gating is not applied. Compiled functions are not inserted into the AST.

### 4. Missing directive parsing (program.rs vs Program.ts:52-144)
TypeScript has full directive parsing:
- `tryFindDirectiveEnablingMemoization` (Program.ts:52-67)
- `findDirectiveDisablingMemoization` (Program.ts:69-86)
- `findDirectivesDynamicGating` (Program.ts:87-144)

Rust version doesn't parse directives at all.

## Moderate Issues

### 1. Simplified tryCompileFunction (program.rs:313-377 vs Program.ts:675-732)
Rust version is simplified:
- No directive checking
- No module scope opt-out handling
- No mode-based return (annotation mode, lint mode)
- Just calls compile_fn and returns

TypeScript has full logic for all compilation modes and directive handling.

### 2. Missing helper functions
Many helper functions from Program.ts not present:
- `isHookName` (line 897)
- `isHook` (line 906)
- `isComponentName` (line 927)
- `isReactAPI` (line 931)
- `isForwardRefCallback` (line 951)
- `isMemoCallback` (line 964)
- `isValidPropsAnnotation` (line 972)
- `isValidComponentParams` (line 1017)
- `getComponentOrHookLike` (line 1049)
- `callsHooksOrCreatesJsx` (line 1096)
- `returnsNonNode` (line 1138)
- `getFunctionName` (line 1174)
- `getFunctionReferencedBeforeDeclarationAtTopLevel` (line 1230)

These are all needed for real-world compilation.

## Minor Issues

### 1. Incomplete error handling (program.rs:101-114)
Creates stub `CompileResult::Error` but doesn't include all error details from TypeScript.

### 2. Missing shouldSkipCompilation (program.rs vs Program.ts:782-816)
TypeScript checks:
- If filename matches sources filter
- If memo cache import already exists
Rust doesn't have this logic yet.

## Architectural Differences

### 1. Fixture-based compilation (program.rs:118-237)
**Intentional**: Rust version is designed for fixture testing, not full program compilation. Uses `fixture_utils::extract_function` to get specific functions by index.

TypeScript traverses the full AST to find all components/hooks.

**Expected**: Will be replaced with real traversal when Rust AST traversal is implemented.

### 2. No AST mutation (program.rs:258-309)
**Expected**: `apply_compiled_functions` is a stub. AST mutation not yet implemented in Rust port.

Will need:
- AST replacement logic
- Gating insertion
- Import insertion (via `add_imports_to_program`)

### 3. Simplified context creation (program.rs:79-95)
Rust creates context without Babel program/scope. TypeScript creates from `NodePath<t.Program>`.

**Expected**: Will need adapter when full program traversal is implemented.

## Missing from Rust Port

### All helper functions for type inference
See Moderate Issues #2 above - entire suite of helper functions not ported.

### Directive parsing
No opt-in/opt-out directive support yet.

### Gating application
`insertGatedFunctionDeclaration` not called.

### AST mutation
Cannot replace compiled functions in AST yet.

### Traversal infrastructure
Cannot discover functions in real programs.

## Additional in Rust Port

### 1. Fixture-focused design (program.rs:118-237)
Uses `fixture_utils` module for extracting test functions. Not in TypeScript.

**Purpose**: Enables testing of compilation pipeline before full AST traversal is implemented.

### 2. Explicit error Result types (program.rs:42-114)
Returns `Result<CompileResult, ()>` instead of throwing/handling inline.

**Purpose**: Idiomatic Rust error handling.
