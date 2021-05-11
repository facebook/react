# Coding Style

## Naming

### Abbrevations

Abbrevations can be preferable over full name when it helps with making things
stand out for recognition and code searching, e.g.

1. when we naming a notion specific to us (e.g. `MemoCache`, `SCCGraph`).
2. when it helps with avoid naming clash with 3rd-party libraries (e.g. Babel).
3. when it forms a nice symmetry with its counter parts (e.g. `Val`/`Ref`).
4. when it's canonical in the indursty/academia (e.g. `Def`/`Use`).
5. when it helps with differentiating internal concepts, e.g. it's very common
   to name AST and IR a bit differently (alternatively, always use namespace).

- `Val`: Value
- `Ref`: Reference
- `Stmt`: Statement
- `Expr`: Expression
- `Decl`: Declaration
- `Func`: Function
- `Param`: Parameter
- `Ident`: Identifier

- `Mut`: Mutable
- `Immut`: Immutable

- `Def`: Definition
- `Use`: Uses
- `Instr`: Instruction

- `Dep`: Dependency
- `Infer`: Inference
- `Alloc`: Allocation
- `Gen`: Generator

## ADT vs Classes

For trivial cases where ADT and classes are interchangble, classes are favorable
due to its conciseness.

For cases where some algebraic structures or type gynastics are needed
(e.g. IR/LIR), the constraints of classes and subtyping can be a burden to work
around so we prefer to use our own ADT-like encoding for its flexibility and
extensibility.

For instance, `IR.Val` is an ADT tagged by `ValKind`:

1. It would have been more difficult to encode `InputVal` and `ReactiveVal` as
   types since they are defined upon refinements.
2. It's impossible (or at least non-trivial and painful) to type things like
   `Val#reference`, `Ref<V>` and `ValAST<Val>` accurately with classes since
   things may not follow the subtyping rules (it may be possible, but painful,
   to manually annotate every variance carefully, which TS only recently add
   support, to get things type check). Instead, we have more freedom to define
   types for each variants. We can even pattern match on type parameter with
   [conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#handbook-content) to get pretty far to somewhere like [GADT](https://en.wikipedia.org/wiki/Generalized_algebraic_data_type).
3. It offers more safety gurantees over `instanceof` by default unless you opted
   into visitor pattern which is also painful to write because it's closing at
   data axis instead of operation axis (see [Expresion Problem](https://wiki.c2.com/?ExpressionProblem)).

N.B. The fact that we are not encoding ADT like [the way TS handbook suggested to encode discrinminated unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) but instead encoding it
as a combination of `enum` + `interface` + factory functions is merely a mean to
take some advantage of subtyping for more code sharing (e.g. the common part of
`Val` variants are therefore extracted in `Val`).

## Type Safety

TBD

## Test

TBD

## Format

TBD

## Commit Messages

Add `[Tag]` to help with finding reviewers (Github tags are not visible everywhere)

## Code Review

TBD
