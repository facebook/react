# forget_reactive_ir

The Reactive IR is an intermediate representation used to encode reactivity information, used for later stages of analysis focused on memoization/reactivity.

Unlike HIR's "flat" control-flow-graph style representation, Reactive IR is tree-shaped. Blocks can contain HIR instructions as well as additional nested
statements (used for all expressions that have control-flow semantics), and terminals such as if or for have blocks rather than pointing to them indirectly by block id.
