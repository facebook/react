# react_diagnostics

Types for representing compiler diagnostics. Includes a general-purpose representation
of diagnostics with related information which can be converted into `miette::Diagnostic` to exploit miette's pretty printing of errors. 

Unlike miette, lsp_types, and other diagnostic libraries, the error severities match
React Compiler's semantics. The intent is that a given diagnostic may be displayed as
an error, warning, or not displayed at all depending on the context in which the 
compiler is being used. For example, an ESLint plugin powered by React Compiler may ignore
InvalidSyntax diagnostics, whereas the regular compiler may report them as errors.
