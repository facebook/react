# Review: compiler/crates/react_compiler_hir/src/lib.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Types.ts`

## Summary
This file defines the core HIR data model (ID newtypes, HirFunction, Terminal, InstructionValue, Place, Identifier, Type, etc.). It is a large and comprehensive port. Most types are structurally faithful to the TypeScript original with expected architectural differences. Several notable divergences exist in array method signatures, missing helper functions, and type representations.

## Major Issues

1. **`pop` callee effect is `Read` instead of `Store`**
   The `pop` function in `build_array_shape` (globals.rs) uses `simple_function` which defaults `callee_effect` to `Effect::Read`. In TS (`ObjectShape.ts:424-430`), `pop` has `calleeEffect: Effect.Store`. However, this is actually defined in globals.rs, not lib.rs. Noted here for reference but the actual divergence is in globals.rs.

2. **`ArrayExpression` elements type divergence**
   `/compiler/crates/react_compiler_hir/src/lib.rs:598:5` - `ArrayExpression.elements` uses `Vec<ArrayElement>` where `ArrayElement` is `Place | Spread | Hole`. In TS (`HIR.ts:677-680`), `ArrayExpression.elements` is `Array<Place | SpreadPattern | Hole>`. The Rust version wraps this in a separate `ArrayElement` enum while TS uses a union inline. This is structurally equivalent but `PlaceOrSpread` (used for call args) and `ArrayElement` are separate enums in Rust while TS uses the same union type.

3. **`HirFunction.aliasing_effects` uses `Option<Vec<()>>` placeholder**
   `/compiler/crates/react_compiler_hir/src/lib.rs:115:5` - `aliasing_effects: Option<Vec<()>>` is a placeholder using unit type `()` instead of the actual `AliasingEffect` type. In TS (`HIR.ts:296`), this is `Array<AliasingEffect> | null`. This means aliasing effects cannot actually be stored or processed.

4. **`Instruction.effects` uses `Option<Vec<()>>` placeholder**
   `/compiler/crates/react_compiler_hir/src/lib.rs:467:5` - Same issue as above. TS (`HIR.ts:656`): `effects: Array<AliasingEffect> | null`.

5. **`Return` terminal `effects` uses `Option<Vec<()>>` placeholder**
   `/compiler/crates/react_compiler_hir/src/lib.rs:202:9` - TS (`HIR.ts:458`): `effects: Array<AliasingEffect> | null`.

6. **`MaybeThrow` terminal `effects` uses `Option<Vec<()>>` placeholder**
   `/compiler/crates/react_compiler_hir/src/lib.rs:308:9` - TS (`HIR.ts:619`): `effects: Array<AliasingEffect> | null`.

7. **`ReactiveScope` is missing most fields**
   `/compiler/crates/react_compiler_hir/src/lib.rs:1216-1220` - Rust `ReactiveScope` only has `id` and `range`. TS (`HIR.ts:1579-1598+`) has `dependencies`, `declarations`, `reassignments`, and many more fields. These are critical for reactive scope analysis.

## Moderate Issues

1. **`HirFunction.params` type divergence**
   `/compiler/crates/react_compiler_hir/src/lib.rs:106:5` - Uses `Vec<ParamPattern>` where `ParamPattern` is an enum of `Place(Place)` and `Spread(SpreadPattern)`. TS (`HIR.ts:288`) uses `Array<Place | SpreadPattern>`. Functionally equivalent but uses a wrapper enum instead of a union.

2. **`HirFunction.return_type_annotation` is `Option<String>` instead of AST node**
   `/compiler/crates/react_compiler_hir/src/lib.rs:107:5` - TS (`HIR.ts:289`) uses `t.FlowType | t.TSType | null`. The Rust port stores only a string representation, losing type structure.

3. **`DeclareLocal.type_annotation` is `Option<String>` instead of AST node**
   `/compiler/crates/react_compiler_hir/src/lib.rs:517:9` - Same pattern. TS (`HIR.ts:906`) uses `t.FlowType | t.TSType | null`.

4. **`StoreLocal.type_annotation` is `Option<String>` instead of AST node**
   `/compiler/crates/react_compiler_hir/src/lib.rs:527:9` - TS (`HIR.ts:1186`) uses `type: t.FlowType | t.TSType | null`.

5. **`TypeCastExpression` stores `type_annotation_name` and `type_annotation_kind` as `Option<String>` instead of AST type nodes**
   `/compiler/crates/react_compiler_hir/src/lib.rs:577-578:9` - TS (`HIR.ts:966-980`) has a union of `{typeAnnotation: t.FlowType, typeAnnotationKind: 'cast'}` and `{typeAnnotation: t.TSType, typeAnnotationKind: 'as' | 'satisfies'}`.

6. **`UnsupportedNode` stores `node_type: Option<String>` instead of `node: t.Node`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:718:9` - TS (`HIR.ts:1122`) stores the actual Babel AST node for codegen pass-through.

7. **`DeclareContext.lvalue` uses full `LValue` instead of restricted kind set**
   `/compiler/crates/react_compiler_hir/src/lib.rs:520:9` - TS (`HIR.ts:911-918`) restricts `DeclareContext.lvalue.kind` to `Let | HoistedConst | HoistedLet | HoistedFunction`. The Rust port allows any `InstructionKind`.

8. **`StoreContext.lvalue` uses full `LValue` instead of restricted kind set**
   `/compiler/crates/react_compiler_hir/src/lib.rs:530:9` - TS (`HIR.ts:932-938`) restricts to `Reassign | Const | Let | Function`. The Rust port allows any `InstructionKind`.

9. **`CallExpression` missing `typeArguments` field**
   `/compiler/crates/react_compiler_hir/src/lib.rs:558-561` - TS (`HIR.ts:870`) has `typeArguments?: Array<t.FlowType>`.

10. **`BasicBlock.phis` is `Vec<Phi>` instead of `Set<Phi>`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:168:5` - TS (`HIR.ts:353`) uses `phis: Set<Phi>`. Using `Vec` loses deduplication semantics.

11. **`HirFunction.id` is `Option<String>` instead of `ValidIdentifierName | null`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:103:5` - TS validates identifier names through the `ValidIdentifierName` opaque type. The Rust port skips validation.

12. **`PlaceOrSpread` missing `Hole` variant**
    `/compiler/crates/react_compiler_hir/src/lib.rs:1062-1065` - In TS, `CallExpression.args` and `MethodCall.args` are `Array<Place | SpreadPattern>` (no Hole). But `ArrayExpression.elements` includes Hole. This is correct -- `PlaceOrSpread` does not need Hole. But `NewExpression.args` also uses `PlaceOrSpread` which matches TS.

13. **`ObjectPropertyKey::Number` stores `FloatValue` instead of raw `f64`/`number`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:1037:5` - TS (`HIR.ts:721`) uses `name: number`. Using `FloatValue` adds hashing support but changes the representation.

15. **`Scope` and `PrunedScope` terminals store `ScopeId` instead of `ReactiveScope`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:318-331` - TS (`HIR.ts:622-638`) stores `scope: ReactiveScope` directly on these terminals. The Rust port stores `scope: ScopeId` as documented in the architecture guide.

## Minor Issues

1. **`HirFunction.env` field is absent**
   `/compiler/crates/react_compiler_hir/src/lib.rs:100-116` - TS (`HIR.ts:286`) includes `env: Environment`. The Rust architecture passes `env` separately to passes, so this is intentional.

2. **Missing `isStatementBlockKind` and `isExpressionBlockKind` helper functions**
   TS (`HIR.ts:332-345`) has these helpers. Not present in Rust.

3. **Missing `convertHoistedLValueKind` helper function**
   TS (`HIR.ts:761-780`). Not present in Rust.

4. **Missing `isMutableEffect` helper function**
   TS (`HIR.ts:1550-1577`). Not present in Rust.

5. **Missing `promoteTemporary`, `promoteTemporaryJsxTag`, `isPromotedTemporary`, `isPromotedJsxTemporary` helpers**
   TS (`HIR.ts:1373-1410`). Not present in Rust.

6. **Missing `makeTemporaryIdentifier`, `forkTemporaryIdentifier` helpers**
   TS (`HIR.ts:1293-1317`). Not present in Rust.

7. **Missing `validateIdentifierName`, `makeIdentifierName` helpers**
   TS (`HIR.ts:1319-1365`). Not present in Rust.

8. **`PrimitiveValue` is an enum, TS uses a union of literal types**
   `/compiler/crates/react_compiler_hir/src/lib.rs:778-784` - TS (`HIR.ts:1176`) uses `value: number | boolean | string | null | undefined`. The Rust enum is equivalent but more explicit.

9. **`StartMemoize.deps_loc` is `Option<Option<SourceLocation>>` instead of `SourceLocation | null`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:709:9` - TS (`HIR.ts:828`) uses `depsLoc: SourceLocation | null`. The double Option in Rust is unusual.

10. **`StartMemoize` missing `hasInvalidDeps` field**
    `/compiler/crates/react_compiler_hir/src/lib.rs:706-710` - TS (`HIR.ts:829`) has `hasInvalidDeps?: true`.

11. **`FinishMemoize.pruned` is `bool` instead of optional `true`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:714:9` - TS (`HIR.ts:837`) uses `pruned?: true`.

12. **Missing `_staticInvariant*` type-checking functions**
    TS uses these functions as compile-time assertions. Not needed in Rust due to exhaustive pattern matching.

13. **`TemplateQuasi` is a separate struct instead of inline object**
    `/compiler/crates/react_compiler_hir/src/lib.rs:887-890` - TS (`HIR.ts:1049,1055`) uses `{raw: string; cooked?: string}` inline.

14. **`TaggedTemplateExpression.value` is a single `TemplateQuasi` instead of the inline shape**
    `/compiler/crates/react_compiler_hir/src/lib.rs:665:9` - TS (`HIR.ts:1049`) has `value: {raw: string; cooked?: string}`. The TS type is the same shape but inline.

15. **Missing `AbstractValue` type**
    TS (`HIR.ts:1412-1416`). Not present in Rust.

16. **`TemplateLiteral` `quasis` is `Vec<TemplateQuasi>` vs TS's `Array<{raw: string; cooked?: string}>`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:670-671` - Structurally equivalent but uses named struct.

17. **Naming: `fn_type` vs `fnType`, `is_async` vs `async`**
    Rust naming convention applied throughout. Expected.

18. **`Place.kind` field is absent**
    TS (`HIR.ts:1165`) has `kind: 'Identifier'`. Rust omits the discriminant tag since there's only one kind.

## Architectural Differences

1. **ID-based arenas instead of shared references**
   `/compiler/crates/react_compiler_hir/src/lib.rs:17-42` - `IdentifierId`, `BlockId`, `ScopeId`, etc. are `u32` newtypes. TS uses shared object references. Documented in `rust-port-architecture.md`.

2. **`Place.identifier` is `IdentifierId` instead of `Identifier`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:918:5` - TS (`HIR.ts:1166`) stores the full `Identifier` object. Documented.

3. **`Identifier.scope` is `Option<ScopeId>` instead of `ReactiveScope | null`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:930:5` - TS (`HIR.ts:1275`) stores inline `ReactiveScope`. Documented.

4. **`Identifier.type_` is `TypeId` instead of `Type`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:931:5` - TS (`HIR.ts:1276`) stores inline `Type`. Documented.

5. **`EvaluationOrder` replaces TS `InstructionId` for ordering**
   `/compiler/crates/react_compiler_hir/src/lib.rs:28-30` - Documented renaming.

6. **`InstructionId` is an index into flat instruction table**
   `/compiler/crates/react_compiler_hir/src/lib.rs:23-25` - Documented.

7. **`BasicBlock.instructions` is `Vec<InstructionId>` instead of `Array<Instruction>`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:165:5` - Uses indices into flat instruction table. Documented.

8. **`HirFunction.instructions` flat instruction table**
   `/compiler/crates/react_compiler_hir/src/lib.rs:111:5` - New field for flat instruction storage. Documented.

9. **`LoweredFunction.func` is `FunctionId` instead of `HIRFunction`**
   `/compiler/crates/react_compiler_hir/src/lib.rs:1076:5` - Uses function arena. Documented.

10. **`FloatValue` wrapper for deterministic hashing**
    `/compiler/crates/react_compiler_hir/src/lib.rs:48-93` - Needed because Rust's `f64` doesn't implement `Hash` or `Eq`. No TS equivalent needed.

11. **`Phi.operands` is `IndexMap<BlockId, Place>` instead of `Map<BlockId, Place>`**
    `/compiler/crates/react_compiler_hir/src/lib.rs:175:5` - Uses `IndexMap` for ordered iteration. Documented.

## Missing TypeScript Features

1. **Reactive function types** (`ReactiveFunction`, `ReactiveBlock`, `ReactiveTerminal`, etc.) - TS (`HIR.ts:59-167`) defines the reactive IR tree types. Not present in Rust, presumably not yet needed.

2. **`getHookKindForType` function** - Defined in `HIR.ts` but lives in `environment.rs` in the Rust port.

3. **`BindingKind` from `@babel/traverse`** - TS re-exports this. Rust defines its own `BindingKind` enum.

4. **`TBasicBlock<T>`, `TInstruction<T>` generic type aliases** - TS has these for type narrowing. Not needed in Rust.

5. **`NonLocalImportSpecifier` type alias** - TS (`HIR.ts:1233-1238`) has this. Rust uses `NonLocalBinding::ImportSpecifier` directly.

6. **Many `make*` factory functions** (`makeBlockId`, `makeIdentifierId`, `makeInstructionId`, `makeScopeId`, `makeDeclarationId`) - These are on `Environment` in Rust.

7. **`ValidIdentifierName` opaque type** and validation - Rust uses plain `String`.

8. **`StoreLocal` declared as separate type** - TS (`HIR.ts:1182-1188`) has `StoreLocal` as a named type alias. Rust uses it inline in `InstructionValue`.

9. **`PropertyLoad` as separate named type** - TS (`HIR.ts:1189-1194`). Rust uses inline.

