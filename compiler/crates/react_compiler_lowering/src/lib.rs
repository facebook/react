pub mod build_hir;
pub mod find_context_identifiers;
pub mod hir_builder;

use react_compiler_ast::expressions::{ArrowFunctionExpression, FunctionExpression};
use react_compiler_ast::statements::FunctionDeclaration;

/// Represents a reference to a function AST node for lowering.
/// Analogous to TS's `NodePath<t.Function>` / `BabelFn`.
pub enum FunctionNode<'a> {
    FunctionDeclaration(&'a FunctionDeclaration),
    FunctionExpression(&'a FunctionExpression),
    ArrowFunctionExpression(&'a ArrowFunctionExpression),
}

// The main lower() function - delegates to build_hir
pub use build_hir::lower;

// Re-export post-build helper functions used by optimization passes
pub use hir_builder::{
    each_terminal_successor,
    get_reverse_postordered_blocks,
    mark_instruction_ids,
    mark_predecessors,
    remove_dead_do_while_statements,
    remove_unnecessary_try_catch,
    remove_unreachable_for_updates,
    terminal_fallthrough,
};
