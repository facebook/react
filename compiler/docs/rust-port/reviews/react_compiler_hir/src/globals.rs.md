# Review: compiler/crates/react_compiler_hir/src/globals.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Globals.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/ObjectShape.ts` (for `BUILTIN_SHAPES`)

## Summary
This file ports the global type registry and built-in shape definitions. It covers React hook APIs, JS built-in types (Array, Set, Map, etc.), and typed/untyped global objects. While the overall structure is faithful, there are numerous differences in individual method signatures, missing methods, missing aliasing configs, and divergent effect/return-type annotations.

## Major Issues

1. **Array `pop` callee effect is wrong**
   `/compiler/crates/react_compiler_hir/src/globals.rs:214` - `pop` uses `simple_function` which defaults `callee_effect` to `Effect::Read`. TS (`ObjectShape.ts:425-430`) specifies `calleeEffect: Effect.Store`. The `pop` method mutates the array (removes the last element), so `Store` is correct. This will cause incorrect effect inference for `Array.pop()` calls.

2. **Array `at` callee effect is wrong**
   `/compiler/crates/react_compiler_hir/src/globals.rs:215-221` - Uses `simple_function` which defaults `callee_effect` to `Effect::Read`. TS (`ObjectShape.ts:434-439`) specifies `calleeEffect: Effect.Capture`. The `at` method returns a reference to an array element, so `Capture` is correct.

3. **Array `map`, `filter`, `find`, `findIndex`, `reduce`, `forEach`, `every`, `some`, `flatMap` use `positionalParams: vec![Effect::ConditionallyMutate]` instead of `restParam: Effect::ConditionallyMutate`**
   `/compiler/crates/react_compiler_hir/src/globals.rs:276-391` - In TS (`ObjectShape.ts:505-641`), these array methods use `restParam: Effect.ConditionallyMutate` with `positionalParams: []`. The Rust version puts `ConditionallyMutate` in `positionalParams` instead. This changes how the effect is applied: with `positionalParams`, only the first argument gets the effect; with `restParam`, all arguments get it. For callbacks that also take a `thisArg` parameter, this means the `thisArg` gets `Effect::Read` (from default) in Rust instead of `Effect::ConditionallyMutate`.

4. **Array `map` and `flatMap` missing `noAlias: true`**
   `/compiler/crates/react_compiler_hir/src/globals.rs:276-292` and `375-391` - TS (`ObjectShape.ts:516,577`) sets `noAlias: true` on `map` and `flatMap`. The Rust `FunctionSignatureBuilder` defaults `no_alias` to `false`. This means the compiler won't optimize argument memoization for these methods.

5. **Array `filter`, `find`, `findIndex`, `forEach`, `every`, `some` missing `noAlias: true`**
   `/compiler/crates/react_compiler_hir/src/globals.rs:293-374` - TS (`ObjectShape.ts:594,650,659,611,628`) sets `noAlias: true` for all of these. Rust defaults to `false`.

6. **Array `push` callee effect is wrong and missing aliasing signature**
   `/compiler/crates/react_compiler_hir/src/globals.rs:439-445` - Uses `simple_function` which defaults `callee_effect` to `Effect::Read`. TS (`ObjectShape.ts:458-488`) specifies `calleeEffect: Effect.Store` and includes a detailed aliasing signature with `Mutate @receiver`, `Capture @rest -> @receiver`, `Create @returns`. The Rust version has none of this.

7. **Array missing many methods from TS**
   The TS `BUILTIN_SHAPES` Array definition (`ObjectShape.ts:401-682`) includes methods not in the Rust port:
   - `flat` (present in Rust at line 238, but TS defines it at ObjectShape.ts line 682+ area - actually TS has a comment "TODO: rest of Array properties" suggesting some are missing there too)

   Actually, comparing more carefully, the Rust port includes several methods not in TS's `BUILTIN_SHAPES`: `flat`, `toReversed`, `toSorted`, `toSpliced`, `reverse`, `fill`, `splice`, `unshift`, `keys`, `values`, `entries`, `toString`, `lastIndexOf`, `findLast`, `findLastIndex`, `reduceRight`. These are additions in the Rust port beyond what TS defines. This is actually fine -- they add coverage.

8. **Array `map` missing complex aliasing signature**
   `/compiler/crates/react_compiler_hir/src/globals.rs:276-292` - TS (`ObjectShape.ts:504-573`) has a detailed aliasing signature for `map` with temporaries (`@item`, `@callbackReturn`, `@thisArg`), `CreateFrom`, `Apply`, and `Capture` effects. The Rust version has no aliasing config at all.

9. **Set shape missing many properties**
   `/compiler/crates/react_compiler_hir/src/globals.rs:553-608` - The Rust Set shape has: `has`, `add`, `delete`, `size`, `forEach`, `values`, `keys`, `entries`. The TS Set shape (`ObjectShape.ts:702-919`) additionally has: `clear`, `difference`, `union`, `symmetricalDifference`, `isSubsetOf`, `isSupersetOf`. These are important Set methods.

10. **Set `add` callee effect and return type differ**
    `/compiler/crates/react_compiler_hir/src/globals.rs:555-561` - Rust uses `callee_effect` default `Read` (from `simple_function`), returns `Type::Poly`. TS (`ObjectShape.ts:712-745`) uses `calleeEffect: Effect.Store`, returns `{kind: 'Object', shapeId: BuiltInSetId}`, and has a detailed aliasing signature with `Assign @receiver -> @returns`, `Mutate @receiver`, `Capture @rest -> @receiver`.

11. **Set `add` missing aliasing signature**
    Same as above -- TS has aliasing, Rust does not.

12. **Map shape missing `clear` method**
    `/compiler/crates/react_compiler_hir/src/globals.rs:610-678` - TS (`ObjectShape.ts:920-935`) has `clear` for Map. Rust does not.

13. **Map `set` return type differs**
    `/compiler/crates/react_compiler_hir/src/globals.rs:619-631` - Returns `Type::Poly`. TS (`ObjectShape.ts:976-982`) returns `{kind: 'Object', shapeId: BuiltInMapId}`.

14. **Map `get` callee effect differs**
    `/compiler/crates/react_compiler_hir/src/globals.rs:612-618` - Uses default `callee_effect: Effect::Read` (from `simple_function`). TS (`ObjectShape.ts:948-954`) uses `calleeEffect: Effect.Capture`.

15. **Set and Map `forEach` use `positionalParams: vec![Effect::ConditionallyMutate]` instead of `restParam`**
    `/compiler/crates/react_compiler_hir/src/globals.rs:576-589` (Set) and `646-659` (Map) - TS uses `restParam: Effect.ConditionallyMutate` with `positionalParams: []`.

16. **Set and Map `forEach` missing `noAlias` and `mutableOnlyIfOperandsAreMutable`**
    TS sets `noAlias: true` and `mutableOnlyIfOperandsAreMutable: true` for both.

17. **Set and Map iterator methods (`keys`, `values`, `entries`) have wrong callee effect**
    `/compiler/crates/react_compiler_hir/src/globals.rs:590-592` (Set), `660-662` (Map) - Use `simple_function` which defaults `callee_effect` to `Effect::Read`. TS (`ObjectShape.ts:889-917`, `1001-1029`) uses `calleeEffect: Effect.Capture` for all iterator methods.

18. **`useEffect` hook for React namespace object missing aliasing signature**
    `/compiler/crates/react_compiler_hir/src/globals.rs:1676-1689` - The `useEffect` hook registered in the `React.*` namespace does not have the aliasing signature that the top-level `useEffect` has (lines 1127-1164). TS achieves sharing by putting `useEffect` in `REACT_APIS` and then spreading `...REACT_APIS` into the React object. The Rust port manually re-registers hooks for the React namespace, losing the aliasing signature.

19. **Missing `useEffectEvent` aliasing signature**
    `/compiler/crates/react_compiler_hir/src/globals.rs:1243-1259` - TS (`Globals.ts:846-865`) does not have an explicit aliasing signature on `useEffectEvent` either, but the `CLAUDE.md` documentation mentions that `useEffectEvent` should have specific aliasing. Checking TS more carefully: no aliasing config is present. This matches the Rust port.

20. **`globalThis` and `global` are empty objects instead of containing typed globals**
    `/compiler/crates/react_compiler_hir/src/globals.rs:953-967` - TS (`Globals.ts:934-941`) registers `globalThis` and `global` as objects containing all `TYPED_GLOBALS`. The Rust version registers them as empty objects. This means property access on `globalThis` (e.g., `globalThis.Array.isArray()`) won't be typed.

## Moderate Issues

1. **`installTypeConfig` function does not validate hook-name vs hook-type consistency for object properties**
   `/compiler/crates/react_compiler_hir/src/globals.rs:131-133` - Comment at line 131 says "We skip that validation for now." TS (`Globals.ts:1027-1041`) validates and throws `CompilerError.throwInvalidConfig` if a hook-named property doesn't have a hook type (or vice versa).

2. **`installTypeConfig` for function type sets `impure` from config but TS handles `impure` as `boolean | null | undefined`**
   `/compiler/crates/react_compiler_hir/src/globals.rs:77` - `func_config.impure.unwrap_or(false)` correctly handles the optional. Matches TS behavior.

3. **Math functions missing `round`, `sqrt`, `abs`, `sign`, `log`, `log2`, `log10` as individual definitions**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1390-1396` - Actually, these ARE included. The Rust version creates them all via a loop. TS (`Globals.ts:302-380`) defines them individually but they're all pure primitive functions. The Rust version also includes `round`, `sqrt`, `abs`, `sign`, `log`, `log2`, `log10`. Matches TS.

4. **`Math.random` rest_param is `None` in TS but the Rust uses default**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1400-1412` - `Math.random` in Rust uses `FunctionSignatureBuilder` default which sets `rest_param: None`. TS (`Globals.ts:371`) also has `restParam: Effect.Read`. Actually checking more carefully: TS has `restParam: Effect.Read` but `positionalParams: []`. Rust has `rest_param: None` (from default). Wait, the Rust code at line 1400 doesn't set `rest_param` and the default is `None`. But TS has `restParam: Effect.Read`. This is a divergence -- `Math.random()` takes no arguments, so it doesn't matter practically.

5. **`Object.keys` is registered twice in TS (with different configs) but only once in Rust**
   TS (`Globals.ts:87-97,148-176`) registers `Object.keys` twice: once without aliasing and once with aliasing. Since properties is a `Map`, the second registration overwrites the first. The Rust version only has one registration without aliasing.

6. **`Object.entries` and `Object.values` missing aliasing signatures**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1292-1319` - TS (`Globals.ts:116-207`) has aliasing signatures for `Object.entries` (with `Create @returns`, `Capture @object -> @returns`) and `Object.values` (same). The Rust versions have no aliasing config.

7. **`Object.keys` missing aliasing signature**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1264-1277` - TS (`Globals.ts:148-176`) has aliasing signature with `Create @returns`, `ImmutableCapture @object -> @returns`. Not present in Rust.

8. **React namespace `useEffect` missing aliasing signature (duplicate of major issue #18)**

9. **React namespace missing several hooks present in TS**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1599-1704` - The Rust React namespace object includes: `useContext, useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect`. The TS version (`Globals.ts:869-904`) spreads `...REACT_APIS` which includes all hooks: `useContext, useState, useActionState, useReducer, useRef, useImperativeHandle, useMemo, useCallback, useEffect, useLayoutEffect, useInsertionEffect, useTransition, useOptimistic, use, useEffectEvent`. The Rust React namespace is missing: `useActionState`, `useReducer`, `useImperativeHandle`, `useInsertionEffect`, `useTransition`, `useOptimistic`, `use`, `useEffectEvent`.

10. **`has` method on Set and Map uses `pure_primitive_fn` with default `callee_effect: Read`**
    `/compiler/crates/react_compiler_hir/src/globals.rs:554,611` - Matches TS where `has` uses `calleeEffect: Effect.Read`. Correct.

11. **Array `sort` rest_param should be `None`**
    `/compiler/crates/react_compiler_hir/src/globals.rs:392-407` - Rust has `rest_param: None` via explicit setting. TS (`ObjectShape.ts` area near sort, not explicitly shown in read) -- the Rust version is likely correct for sort. Actually checking: TS doesn't define `sort` in `BUILTIN_SHAPES`, it has a `// TODO: rest of Array properties` comment. Sort is a Rust addition.

12. **`getReanimatedModuleType` not ported**
    TS (`Globals.ts:1055-1126`) has a function to build reanimated module types. Not present in Rust.

## Minor Issues

1. **`Global` type alias differs**
   `/compiler/crates/react_compiler_hir/src/globals.rs:23` - Rust: `pub type Global = Type`. TS (`Globals.ts:918`): `export type Global = BuiltInType | PolyType`. Functionally equivalent since Rust's `Type` enum covers both.

2. **`GlobalRegistry` uses `HashMap` instead of `Map`**
   `/compiler/crates/react_compiler_hir/src/globals.rs:26` - Expected type mapping.

3. **`installTypeConfig` takes `_loc: ()` as a placeholder**
   `/compiler/crates/react_compiler_hir/src/globals.rs:39` - TS passes `SourceLocation`. The Rust port ignores it.

4. **`installTypeConfig` takes `_globals: &mut GlobalRegistry` but doesn't use it**
   `/compiler/crates/react_compiler_hir/src/globals.rs:35` - Parameter prefixed with `_` indicating unused. TS uses globals for potential recursive registration but in practice also rarely uses it.

5. **`build_default_globals` function structure differs from TS**
   `/compiler/crates/react_compiler_hir/src/globals.rs:935-970` - TS builds globals via module-level `const` arrays (`TYPED_GLOBALS`, `REACT_APIS`, `UNTYPED_GLOBALS`) at import time. Rust builds them via explicit function calls. Structurally different but functionally equivalent.

6. **`_jsx` function registered in typed globals**
   `/compiler/crates/react_compiler_hir/src/globals.rs:1717-1729` - Matches TS (`Globals.ts:907-915`).

7. **`experimental_useEffectEvent` alias not registered**
   TS registers `useEffectEvent` with both `'useEffectEvent'` and `'experimental_useEffectEvent'` names. The Rust port only registers `'useEffectEvent'`.

## Architectural Differences

1. **Uses `&mut ShapeRegistry` instead of module-level mutable state**
   TS uses `const DEFAULT_SHAPES` at module level. Rust passes mutable references. Expected.

2. **Helper functions (`simple_function`, `pure_primitive_fn`) are Rust-specific**
   `/compiler/crates/react_compiler_hir/src/globals.rs:178-209` - Reduce boilerplate for common function patterns. TS defines each function inline.

3. **`build_builtin_shapes` and `build_default_globals` are explicit functions instead of module-level initialization**
   Expected Rust pattern for initialization.

## Missing TypeScript Features

1. **`getReanimatedModuleType` function** - For Reanimated library support.
2. **`experimental_useEffectEvent` alias** in globals.
3. **Aliasing signatures** for `Object.keys`, `Object.entries`, `Object.values`, `Array.push`, `Array.map`, `Set.add`.
4. **Set methods**: `clear`, `difference`, `union`, `symmetricalDifference`, `isSubsetOf`, `isSupersetOf`.
5. **Map method**: `clear`.
6. **`globalThis` and `global` containing typed globals** instead of empty objects.
7. **Complete React namespace** with all hook types (missing several hooks).
8. **`noAlias: true`** on array iteration methods (`map`, `filter`, `find`, `forEach`, `every`, `some`, `flatMap`, `findIndex`).
9. **Correct `positionalParams` vs `restParam` usage** for array/Set/Map callback methods.
