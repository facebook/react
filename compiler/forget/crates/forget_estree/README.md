# forget_estree

This crate is a Rust representation of the [ESTree format](https://github.com/estree/estree/tree/master) and
popular extenions including JSX and (eventually) Flow and TypeScript.

This crate is intended as the main interchange format with outside code. A typical integration with Forget
will look as follows:

1. Host Compiler parses into the host AST format.
2. Host Compiler converts into `forget_estree`.
3. Host Compiler invokes Forget to compile the input, which (conceptually) 
   returns the resulting code in `forget_estree` format.
4. Host Compiler convert back from `forget_estree` to its host AST format.

Because Forget is intended to support JavaScript-based toolchains, `forget_estree` is designed to support
accurate serialization to/from estree-compatible JSON. We may also support the Babel AST format 
(a variant of ESTree) as well, depending on demand.