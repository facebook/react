pub mod build_hir;
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
