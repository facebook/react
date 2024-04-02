# React Compiler — Goals, Design Principles, and Architecture

This document describes the goals, design principles, and high-level architecture of React Compiler. See the code for specifics of the data structures and compiler passes.

## Goals

The idea of React Compiler is to allow developers to use React's familiar declarative, component-based programming model, while ensuring that apps are fast by default. Concretely we seek to achieve the following goals:

* Bound the amount of re-rendering that happens on updates to ensure that apps have predictably fast peformance by default.
* Keep startup time neutral with pre-React Compiler performance. Notably, this means holding code size increases and memoization low enough to not impact startup.
* Retain React's familiar declarative, component-oriented programming model. Ie, the solution should not fundamentally change how developers think about writing React, and should generally _remove_ concepts (the need to use React.memo(), useMemo(), and useCallback()) rather than introduce new concepts.
* "Just work" on idiomatic React code that follows React's rules (pure render functions, the rules of hooks, etc).
* Support typical debugging and profiling tools and workflows.
* Be predictable and understandable enough by React developers — ie developers should be able to quickly develop a rough intuition of how React Compiler works.
* Not require explicit annotations (types or otherwise) for typical product code. We may provide features that allow developers to opt-in to using type information to enable additional optimizations, but the compiler should work well without type information or other annotations.

## Non-Goals

The following are explicitly *not* goals for React Compiler:

* Provide perfectly optimal re-rendering with zero unnecessary recomputation. This is a non-goal for several reasons:
  * The runtime overhead of the extra tracking involved can outweight the cost of recomputation in many cases.
  * In cases with conditional dependencies it may not be possible to avoid recomputing some/all instructions.
  * The amount of code may regress startup times, which would conflict with our goal of neutral startup performance.
* Support code that violates React's rules. React's rules exist to help developers build robust, scalable applications and form a contract that allows us to continue improving React without breaking applications. React Compiler depends on these rules to safely transform code, and violations of rules will therefore break React Compiler's optimizations.
* Support legacy React features. Notably we will not support class components due to their inherent mutable state being shared across multiple methods with complex lifetimes and data flow.
* Support 100% of the JavaScript language. In particular, we will not support rarely used features and/or features which are known to be unsafe or which cannot be modeled soundly. For example, nested classes that capture values from their closure are difficult to model accurately bc of mutability, and `eval()` is unsafe. We aim to support the vast majority of JavaScript code (and the TypeScript and Flow dialects)

## Design Principles

Many aspects of the design follow naturally from the above goals:

* The compiler output must be high-level code that retains not just the semantics of the input but also is expressed using similar constructs to the input. For example, rather than convert logical expressions (`a ?? b`) into an `if` statement, we retain the high-level form of the logical expression. Rather than convert all looping constructs to a single form, we retain the original form of the loop. This follows from our goals:
  * High-level code is more compact, and helps reduce the impact of compilation on application size
  * High-level constructs that match what the developer wrote are easier to debug
* From the above, it then follows that the compiler's internal representation must also be high-level enough to be able to output the original high-level constructs. The internal representation is what we call a High-level Intermediate Representation (HIR) — a name borrowed from Rust Compiler. However, React Compiler's HIR is perhaps even more suited to this name, as it retains high-level information (distinguishing if vs logical vs ternary, or for vs while vs for..of) but also represents code as a control-flow graph with no nesting.
