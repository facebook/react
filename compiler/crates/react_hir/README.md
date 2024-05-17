# HIR

This crate defines the High-level Intermediate Representation (HIR) used by React Compiler. 

While the name is inspired by Rust Compiler's HIR, React Compiler's HIR is actually quite different.
Rust's HIR is effectively a compact AST, effectively a slightly more canonical form than the
concrete syntax tree produced by the parser.

React Compiler has two goals that are in tension:

1. React Compiler needs a detailed understanding of the control-flow semantics and performs sophisticated
   data-flow and semantic analysis, all of which benefit from more traditional control-flow graph
   representation with flat instruction sequences.
2. At the same time, React Compiler needs to output code in the original language, and ideally should
   produce code that is as similar as possible (for comprehension) and compact (to avoid increasing
   bandwidth costs and time to download). 

To satisfy both goals, React Compiler's HIR uses a hybrid of a traditional intermediate representation and
an AST:

1. The HIR is a control-flow graph, with one or more basic blocks each of which contains zero or more
   instructions and a terminal node. The blocks are stored in reverse postorder so that compiler passes
   can iterate the graph and always visit all predecessor blocks before successors, except in the 
   presence of loops. This allows many passes to complete in a single pass and eases data flow analysis.
2. Unlike a typical intermediate representation, the HIR uses a rich set of high-level terminal nodes.
   Rather than just a list of successors, for example, the terminal type is an enum of variants such as
   "if", "for", "for-of", "do-while", and other types to represent expression-level control flow in
   JavaScript, such as "ternary", "logical", "optional", "sequence", etc. Notably, these terminals contain
   named fields with links to successors (eg "for" has fields for the init, test, update, and body blocks)
   but also for the "fallthrough" block, ie the block to the code that comes "after" all the logic of 
   the terminal. This fallthrough allows React Compiler to retain the shape of the AST and recover it later in
   compilation.