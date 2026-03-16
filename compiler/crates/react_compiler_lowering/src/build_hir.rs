use indexmap::{IndexMap, IndexSet};
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::File;
use react_compiler_diagnostics::CompilerError;
use react_compiler_hir::*;
use react_compiler_hir::environment::Environment;

use crate::hir_builder::HirBuilder;

/// Main entry point: lower an AST function into HIR.
///
/// `function_index` selects which top-level function in the file to lower
/// (0-based, in source order).
pub fn lower(
    ast: &File,
    scope_info: &ScopeInfo,
    env: &mut Environment,
    function_index: usize,
) -> Result<HirFunction, CompilerError> {
    todo!("lower not yet implemented - M4")
}

fn lower_statement(
    builder: &mut HirBuilder,
    stmt: &react_compiler_ast::statements::Statement,
    label: Option<&str>,
) {
    todo!("lower_statement not yet implemented - M4+")
}

fn lower_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> InstructionValue {
    todo!("lower_expression not yet implemented - M4+")
}

fn lower_expression_to_temporary(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> Place {
    todo!("lower_expression_to_temporary not yet implemented - M4")
}

fn lower_value_to_temporary(builder: &mut HirBuilder, value: InstructionValue) -> Place {
    todo!("lower_value_to_temporary not yet implemented - M4")
}

fn build_temporary_place(builder: &mut HirBuilder, loc: Option<SourceLocation>) -> Place {
    todo!("build_temporary_place not yet implemented - M4")
}

fn lower_assignment(
    builder: &mut HirBuilder,
    loc: Option<SourceLocation>,
    kind: InstructionKind,
    target: &react_compiler_ast::patterns::PatternLike,
    value: Place,
    assignment_style: AssignmentStyle,
) {
    todo!("lower_assignment not yet implemented - M11")
}

fn lower_identifier(
    builder: &mut HirBuilder,
    name: &str,
    start: u32,
    loc: Option<SourceLocation>,
) -> Place {
    todo!("lower_identifier not yet implemented - M4")
}

fn lower_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::MemberExpression,
) -> InstructionValue {
    todo!("lower_member_expression not yet implemented - M6")
}

fn lower_optional_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalMemberExpression,
) -> InstructionValue {
    todo!("lower_optional_member_expression not yet implemented - M12")
}

fn lower_optional_call_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalCallExpression,
) -> InstructionValue {
    todo!("lower_optional_call_expression not yet implemented - M12")
}

fn lower_arguments(
    builder: &mut HirBuilder,
    args: &[react_compiler_ast::expressions::Expression],
    is_dev: bool,
) -> Vec<PlaceOrSpread> {
    todo!("lower_arguments not yet implemented - M6")
}

fn lower_function_to_value(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> InstructionValue {
    todo!("lower_function_to_value not yet implemented - M9")
}

fn lower_function(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> LoweredFunction {
    todo!("lower_function not yet implemented - M9")
}

fn lower_jsx_element_name(
    builder: &mut HirBuilder,
    name: &react_compiler_ast::jsx::JSXElementName,
) -> JsxTag {
    todo!("lower_jsx_element_name not yet implemented - M10")
}

fn lower_jsx_element(
    builder: &mut HirBuilder,
    child: &react_compiler_ast::jsx::JSXChild,
) -> Option<Place> {
    todo!("lower_jsx_element not yet implemented - M10")
}

fn lower_object_method(
    builder: &mut HirBuilder,
    method: &react_compiler_ast::expressions::ObjectMethod,
) -> ObjectProperty {
    todo!("lower_object_method not yet implemented - M8")
}

fn lower_object_property_key(
    builder: &mut HirBuilder,
    key: &react_compiler_ast::expressions::Expression,
) -> ObjectPropertyKey {
    todo!("lower_object_property_key not yet implemented - M8")
}

fn lower_reorderable_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> Place {
    todo!("lower_reorderable_expression not yet implemented - M12")
}

fn is_reorderable_expression(
    builder: &HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> bool {
    todo!("is_reorderable_expression not yet implemented - M12")
}

fn lower_type(node: &react_compiler_ast::expressions::Expression) -> Type {
    todo!("lower_type not yet implemented - M8")
}

fn gather_captured_context(
    _func: &react_compiler_ast::expressions::Expression,
    _scope_info: &ScopeInfo,
    _parent_scope: react_compiler_ast::scope::ScopeId,
) -> IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> {
    todo!("gather_captured_context not yet implemented - M9")
}

fn capture_scopes(
    scope_info: &ScopeInfo,
    from: react_compiler_ast::scope::ScopeId,
    to: react_compiler_ast::scope::ScopeId,
) -> IndexSet<react_compiler_ast::scope::ScopeId> {
    todo!("capture_scopes not yet implemented - M9")
}

/// The style of assignment (used internally by lower_assignment).
pub enum AssignmentStyle {
    /// Assignment via `=`
    Assignment,
    /// Compound assignment like `+=`, `-=`, etc.
    Compound,
}
