# Architecture Overview

Note: This refers to the non-HIR based architecture.

## Diagnostics

Diagnostics are a way to indicate to the user that the compiler has encountered an unexpected issue, and are created in a structured format that is reused in the Playground to imperatively draw model markers ("squigglies") at their respective node locations.

### Diagnostic levels

Rough guidelines for diagnostic levels:

- `Error`: This is emitted by the compiler when it detects an issue that makes it unable to compile the program. This is typically because the program is invalid, or when we have decided to make a specific `Warning` an error. An example for the latter might be when we want to introduce constraints into React programs that the compiler enforces.

- `Warning`: This is emitted by the compiler when we've detected something strange in the program that causes a bailout/deopt.

### Adding new diagnostics

- Define a new error code, monotonically increasing the previous error code by 1. Error codes are in the format `E0000` and must be unique.

## Terminology

### AST

(Babel) Abstract Syntax Tree

### IR

Intermediate Representation.

The purpose of IR is to represent the program in the way to help with static analysis (e.g. mutability of values, dependencies between values).

### LIR

Low-Level Intermediate Representation.

The purpose of LIR is to represent the program in the way to help with
code generation (e.g. grouping, re-ordering).

### ValGraph

Graph representing IR values and their direct dependencies on other IR values.

### SCCGraph

The ValGraph condensed into [strongly connected components](https://en.wikipedia.org/wiki/Strongly_connected_component) to group mututally dependent Vals.

### RedGraph

The SCCGraph processed after a topological iterative algorithm to reduce the dependency relations between SCCs.

This can be seen as the final "Reactive Graph" that captured the relations of "what invalidates me" and "what do I invalidate" (directly and transitively) which will be utilized by the Back End and eventually be materialized by the memoization.

## Compiler Passes

### Middle End Passes

1. `ReactFuncsInfer` uses heurstics to infer functions that are considered as "React Functions" (functional components and hook definitions) and will be used as compilation units.
2. `ParamAnalysis` analyzes React function parameters resolve inputs. For components these are individual props and for Hooks all arguments.
3. `BodyAnalysis` analyzes the body of React functions to create an `IR.Block` for each top level statement. This classifies calls to hooks and records what variable bindings are used as function inputs or going into JSX calls.
4. `DumpIR` optionally records the IR in the compiler context for debugging purposes.
5. `DepGraphAnalysis` collects dependencies for a React function into a `DepGraph.ValGraph` according to syntax-directed rules and analyzes the graph with graph algorithms like graph condensation and topological-orderred iteration.

### Back End Passes

1. `LIRGen` lowers `IR.Func` to `LIR.Func` which groups statements by their inputs into non-reactive or reactive blocks.
2. `MemoCacheAlloc` allocates memo cache locations for change tracking and caching of intermediate values or outputs.
3. `DumpLIR` optionally records the LIR in the compiler context for debugging purposes.
4. `JSGen` the last step that actually modifies the Babel AST with the result of the LIR.
