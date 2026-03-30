//! Builds an index mapping identifier byte offsets to source locations.
//!
//! Walks the function's AST to collect `(start, SourceLocation, is_jsx)` for
//! every Identifier and JSXIdentifier node. This replaces the `referenceLocs`
//! and `jsxReferencePositions` fields that were previously serialized from JS.

use std::collections::HashMap;

use react_compiler_ast::expressions::*;
use react_compiler_ast::jsx::{JSXIdentifier, JSXOpeningElement};
use react_compiler_ast::scope::{ScopeId, ScopeInfo};
use react_compiler_ast::statements::FunctionDeclaration;
use react_compiler_ast::visitor::{AstWalker, Visitor};
use react_compiler_hir::SourceLocation;

use crate::FunctionNode;

/// Source location and whether the identifier is a JSXIdentifier.
pub struct IdentifierLocEntry {
    pub loc: SourceLocation,
    pub is_jsx: bool,
    /// For JSX identifiers that are the root name of a JSXOpeningElement,
    /// stores the JSXOpeningElement's loc (which spans the full tag).
    /// This matches the TS behavior where `handleMaybeDependency` receives
    /// the JSXOpeningElement path and uses `path.node.loc`.
    pub opening_element_loc: Option<SourceLocation>,
    /// True if this identifier is the name of a function/class declaration
    /// (not an expression reference). Used by `gather_captured_context` to
    /// skip non-expression positions, matching the TS behavior where the
    /// Expression visitor doesn't visit declaration names.
    pub is_declaration_name: bool,
}

/// Index mapping byte offset → (SourceLocation, is_jsx) for all Identifier
/// and JSXIdentifier nodes in a function's AST.
pub type IdentifierLocIndex = HashMap<u32, IdentifierLocEntry>;

struct IdentifierLocVisitor {
    index: IdentifierLocIndex,
    /// Tracks the current JSXOpeningElement's loc while walking its name.
    current_opening_element_loc: Option<SourceLocation>,
}

fn convert_loc(loc: &react_compiler_ast::common::SourceLocation) -> SourceLocation {
    SourceLocation {
        start: react_compiler_hir::Position {
            line: loc.start.line,
            column: loc.start.column,
            index: loc.start.index,
        },
        end: react_compiler_hir::Position {
            line: loc.end.line,
            column: loc.end.column,
            index: loc.end.index,
        },
    }
}

impl IdentifierLocVisitor {
    fn insert_identifier(&mut self, node: &Identifier, is_declaration_name: bool) {
        if let (Some(start), Some(loc)) = (node.base.start, &node.base.loc) {
            self.index.insert(
                start,
                IdentifierLocEntry {
                    loc: convert_loc(loc),
                    is_jsx: false,
                    opening_element_loc: None,
                    is_declaration_name,
                },
            );
        }
    }
}

impl Visitor for IdentifierLocVisitor {
    fn enter_identifier(&mut self, node: &Identifier, _scope_stack: &[ScopeId]) {
        self.insert_identifier(node, false);
    }

    fn enter_jsx_identifier(&mut self, node: &JSXIdentifier, _scope_stack: &[ScopeId]) {
        if let (Some(start), Some(loc)) = (node.base.start, &node.base.loc) {
            self.index.insert(
                start,
                IdentifierLocEntry {
                    loc: convert_loc(loc),
                    is_jsx: true,
                    opening_element_loc: self.current_opening_element_loc.clone(),
                    is_declaration_name: false,
                },
            );
        }
    }

    fn enter_jsx_opening_element(&mut self, node: &JSXOpeningElement, _scope_stack: &[ScopeId]) {
        self.current_opening_element_loc = node.base.loc.as_ref().map(|loc| convert_loc(loc));
    }

    fn leave_jsx_opening_element(&mut self, _node: &JSXOpeningElement, _scope_stack: &[ScopeId]) {
        self.current_opening_element_loc = None;
    }

    // Visit function/class declaration and expression name identifiers,
    // which are not walked by the generic walker (to avoid affecting
    // other Visitor consumers like find_context_identifiers).
    fn enter_function_declaration(&mut self, node: &FunctionDeclaration, _scope_stack: &[ScopeId]) {
        if let Some(id) = &node.id {
            self.insert_identifier(id, true);
        }
    }

    fn enter_function_expression(&mut self, node: &FunctionExpression, _scope_stack: &[ScopeId]) {
        if let Some(id) = &node.id {
            self.insert_identifier(id, true);
        }
    }
}

/// Build an index of all Identifier and JSXIdentifier positions in a function's AST.
pub fn build_identifier_loc_index(
    func: &FunctionNode<'_>,
    scope_info: &ScopeInfo,
) -> IdentifierLocIndex {
    let func_start = match func {
        FunctionNode::FunctionDeclaration(d) => d.base.start.unwrap_or(0),
        FunctionNode::FunctionExpression(e) => e.base.start.unwrap_or(0),
        FunctionNode::ArrowFunctionExpression(a) => a.base.start.unwrap_or(0),
    };
    let func_scope = scope_info
        .node_to_scope
        .get(&func_start)
        .copied()
        .unwrap_or(scope_info.program_scope);

    let mut visitor = IdentifierLocVisitor {
        index: HashMap::new(),
        current_opening_element_loc: None,
    };
    let mut walker = AstWalker::with_initial_scope(scope_info, func_scope);

    // Visit the top-level function's own name identifier (if any),
    // since the walker only walks params + body, not the function node itself.
    match func {
        FunctionNode::FunctionDeclaration(d) => {
            if let Some(id) = &d.id {
                visitor.enter_identifier(id, &[]);
            }
            for param in &d.params {
                walker.walk_pattern(&mut visitor, param);
            }
            walker.walk_block_statement(&mut visitor, &d.body);
        }
        FunctionNode::FunctionExpression(e) => {
            if let Some(id) = &e.id {
                visitor.enter_identifier(id, &[]);
            }
            for param in &e.params {
                walker.walk_pattern(&mut visitor, param);
            }
            walker.walk_block_statement(&mut visitor, &e.body);
        }
        FunctionNode::ArrowFunctionExpression(a) => {
            for param in &a.params {
                walker.walk_pattern(&mut visitor, param);
            }
            match a.body.as_ref() {
                ArrowFunctionBody::BlockStatement(block) => {
                    walker.walk_block_statement(&mut visitor, block);
                }
                ArrowFunctionBody::Expression(expr) => {
                    walker.walk_expression(&mut visitor, expr);
                }
            }
        }
    }

    visitor.index
}
