# Review: compiler/crates/react_compiler_optimization/src/constant_propagation.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts

## Summary
The Rust port is a faithful translation of the TypeScript constant propagation pass. The core logic -- fixpoint iteration, phi evaluation, instruction evaluation, conditional pruning -- matches well. There are a few behavioral divergences around JS semantics helpers, a missing `isValidIdentifier` check using Babel, and missing debug assertions. The TS version operates on inline `InstructionValue` objects while the Rust version indexes into a flat instruction table, which is an expected architectural difference.

## Major Issues

1. **`isValidIdentifier` diverges from Babel's implementation**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:756-780`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:8` (imports `isValidIdentifier` from `@babel/types`)
   - The TS version uses Babel's `isValidIdentifier` which handles JS reserved words (e.g., `"class"`, `"return"`, `"if"` are not valid identifiers even though they match ID_Start/ID_Continue). The Rust `is_valid_identifier` does not reject reserved words. This means the Rust version would incorrectly convert `ComputedLoad` with property `"class"` into a `PropertyLoad`, producing invalid output like `obj.class` instead of `obj["class"]`.

2. **`js_number_to_string` may diverge from JS `Number.toString()` for edge cases**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:1023-1044`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:566`
   - The TS version uses JS's native `.concat()` / template literal semantics which calls `ToString(argument)` via the engine. The Rust version uses a custom `js_number_to_string` which may diverge for numbers near exponential notation thresholds (e.g., `0.000001` vs `1e-7`), negative zero (`-0` should be `"0"` in JS), and very large integers that exceed i64 range in the `format!("{}", n as i64)` path.

3. **UnaryExpression `!` operator: Rust restricts to Primitive, TS does not**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:449-467`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:317-327`
   - The TS version does `!operand.value` on any Primitive value, which works because JS's `!` operator applies to all types (including `null`, `undefined`). The Rust version matches on `Constant::Primitive` and then calls `is_truthy`. However, the TS uses `!operand.value` directly, which means for `null` it returns `true`, for `undefined` it returns `true`, for `0` it returns `true`, for `""` it returns `true`. The Rust `is_truthy` matches this behavior correctly, so this is actually fine. No issue here upon closer inspection.

## Moderate Issues

1. **Missing `assertConsistentIdentifiers` and `assertTerminalSuccessorsExist` calls**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:124`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:102-103`
   - The TS version calls `assertConsistentIdentifiers(fn)` and `assertTerminalSuccessorsExist(fn)` at the end of each fixpoint iteration. The Rust version has a TODO comment but does not implement these validation checks. This could mask bugs during development.

2. **`js_abstract_equal` for String-to-Number coercion diverges from JS**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:966-980`
   - The Rust version uses `s.parse::<f64>()` which does not match JS's `ToNumber` for strings. For example, in JS `"" == 0` is `true` (empty string converts to `0`), but `"".parse::<f64>()` returns `Err` in Rust. Similarly, `" 42 " == 42` is `true` in JS (whitespace is trimmed) but `" 42 ".parse::<f64>()` fails in Rust.

3. **TemplateLiteral: TS uses `value.quasis.map(q => q.cooked).join('')` for zero-subexpr case**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:559-577`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:513-519`
   - The TS version uses `.join('')` which would produce `""` if a `cooked` value is `undefined` (joining `undefined` in JS produces the string `"undefined"`). Actually, `.join('')` treats `undefined` as empty string, so they differ in behavior. The Rust version returns `None` if any `cooked` is `None`, which is the correct behavior since an uncooked quasi means a raw template literal that cannot be folded.

4. **TemplateLiteral: TS uses `.concat()` for subexpression joining which has specific ToString semantics**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:599-605`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:566`
   - The TS version uses JS's native `String.prototype.concat` which calls `ToString` internally. For `null` it produces `"null"`, for `undefined` it produces `"undefined"`, etc. The Rust version manually implements this conversion. The Rust version handles `null` -> `"null"`, `undefined` -> `"undefined"`, `boolean` -> `b.to_string()`, `number` -> `js_number_to_string()`, `string` -> `s.clone()`. The TS version excludes non-primitive values explicitly but the Rust does the same by only matching `Constant::Primitive`. This is functionally equivalent except for the `js_number_to_string` divergence noted above.

5. **TemplateLiteral: TS version does not check for `undefined` cooked values in the no-subexpr case**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:563-566`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:513-519`
   - In the TS zero-subexpr case, `value.quasis.map(q => q.cooked).join('')` does not check for `undefined` cooked values (join treats them as empty string). The Rust version explicitly checks `q.cooked.is_none()` and returns `None`. The Rust behavior is arguably more correct since `cooked === undefined` means the template literal has invalid escape sequences and cannot be evaluated.

6. **`js_to_int32` may overflow for very large values**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:1000-1012`
   - The conversion `n.trunc() as i64` can overflow/saturate for very large f64 values beyond i64 range. The JS ToInt32 specification handles this via modular arithmetic. The Rust implementation may produce incorrect results for numbers like `2^53` or larger, though these are uncommon in practice.

7. **PropertyLoad `.length` uses UTF-16 encoding to match JS semantics -- potential divergence for lone surrogates**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:537`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:499`
   - The Rust version uses `s.encode_utf16().count()` which is correct for valid Unicode strings. However, JS strings can contain lone surrogates (invalid UTF-16), while Rust strings are always valid UTF-8. If the source code contains lone surrogates in string literals, the behavior would differ. This is an edge case unlikely to occur in practice.

8. **Phi evaluation: TS uses JS strict equality (`===`), Rust uses custom `js_strict_equal`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:234-273`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:168-222`
   - The TS version compares `operandValue.value !== value.value` which uses JS reference equality for Primitive values. For two `Primitive` constants with `null` values, `null !== null` is `false` in JS, so they are considered equal. The Rust version uses `js_strict_equal` which correctly handles this. However, the TS comparison `operandValue.value !== value.value` for numbers uses JS `!==` which handles NaN correctly (`NaN !== NaN` is `true`). The Rust `js_strict_equal` also handles NaN correctly. These are equivalent.

## Minor Issues

1. **Function signature takes `env: &mut Environment` parameter; TS accesses `fn.env` internally**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:78`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:59`
   - The TS `constantPropagation` takes only `fn: HIRFunction` (which contains `.env`). The Rust version takes both `func` and `env` as separate parameters.

2. **Constant type stores `loc` separately; TS Constant is just `Primitive | LoadGlobal` inline**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:49-59`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:625-626`
   - The Rust `Constant` enum wraps the primitive value and stores `loc` explicitly. The TS version reuses the instruction value types directly (`Primitive` and `LoadGlobal` which already carry `loc`). This is functionally equivalent.

3. **`evaluate_instruction` takes mutable `func` and `env`; TS `evaluateInstruction` takes `constants` and `instr`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:279-284`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:224-227`
   - The Rust version needs `func` and `env` to access the instruction table and function arena. The TS version receives the instruction directly. This is an expected consequence of the arena-based architecture.

4. **`UnaryOperator::Plus`, `BitwiseNot`, `TypeOf`, `Void` are listed but not handled**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:490-493`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:346-347` (`default: return null`)
   - Both versions skip these operators. The Rust version explicitly lists them; the TS version uses a `default` case. Functionally equivalent.

5. **Binary operators: Rust has explicit `BinaryOperator::In | BinaryOperator::InstanceOf => None`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:922`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:481-483` (`default: break`)
   - Both skip these operators. Functionally equivalent.

## Architectural Differences

1. **Inner function processing uses `std::mem::replace` with `placeholder_function()`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:733-740`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:593-594`
   - The TS version directly recurses into `value.loweredFunc.func`. The Rust version must swap the inner function out of the arena, process it, and swap it back. This is necessary due to Rust's borrow checker and the function arena architecture.

2. **Block iteration collects block IDs into a Vec first**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:137`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:112`
   - The Rust version collects block IDs into a Vec to avoid borrow conflicts when mutating the function during iteration. The TS version iterates the map directly.

3. **Instruction access via flat table indexing**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:285`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:133`
   - The Rust version accesses instructions via `func.instructions[instr_id.0 as usize]`. The TS version uses `block.instructions[i]` which returns the Instruction directly.

4. **`Constants` type: `HashMap<IdentifierId, Constant>` vs `Map<IdentifierId, Constant>`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:72`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:626`
   - Uses `HashMap` in Rust (with note that iteration order doesn't matter) vs `Map` in TS. Expected difference.

5. **`reversePostorderBlocks` returns new blocks map vs mutating in place**
   - Rust file: `compiler/crates/react_compiler_optimization/src/constant_propagation.rs:97`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:74`
   - The Rust version assigns the result: `func.body.blocks = get_reverse_postordered_blocks(...)`. The TS version mutates in place: `reversePostorderBlocks(fn.body)`.

## Missing TypeScript Features

1. **`assertConsistentIdentifiers(fn)` and `assertTerminalSuccessorsExist(fn)` are not called**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:102-103`
   - These debug validation checks are not implemented in the Rust version. There is a TODO comment at line 124 of the Rust file.

2. **Babel's `isValidIdentifier` with reserved word checking is not used**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/ConstantPropagation.ts:8`
   - The Rust version implements a custom `is_valid_identifier` that does not check for JS reserved words.
