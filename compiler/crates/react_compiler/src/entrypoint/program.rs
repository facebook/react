// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Main entrypoint for the React Compiler.
//!
//! This module is a port of Program.ts from the TypeScript compiler. It orchestrates
//! the compilation of a program by:
//! 1. Checking if compilation should be skipped
//! 2. Validating restricted imports
//! 3. Finding program-level suppressions
//! 4. Discovering functions to compile (components, hooks)
//! 5. Processing each function through the compilation pipeline
//! 6. Applying compiled functions back to the AST

use std::collections::{HashMap, HashSet};

use react_compiler_ast::common::BaseNode;
use react_compiler_ast::declarations::{
    Declaration, ExportDefaultDecl, ExportDefaultDeclaration, ImportSpecifier, ModuleExportName,
};
use react_compiler_ast::expressions::*;
use react_compiler_ast::patterns::PatternLike;
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::statements::*;
use react_compiler_ast::{File, Program};
use react_compiler_diagnostics::{
    CompilerError, CompilerErrorDetail, CompilerErrorOrDiagnostic, ErrorCategory, SourceLocation,
};
use react_compiler_hir::ReactFunctionType;
use react_compiler_hir::environment_config::EnvironmentConfig;
use react_compiler_lowering::FunctionNode;
use regex::Regex;

use super::compile_result::{
    BindingRenameInfo, CodegenFunction, CompileResult, CompilerErrorDetailInfo,
    CompilerErrorInfo, CompilerErrorItemInfo, DebugLogEntry, LoggerEvent, LoggerPosition,
    LoggerSourceLocation, OrderedLogItem,
};
use super::imports::{
    ProgramContext, add_imports_to_program, get_react_compiler_runtime_module,
    validate_restricted_imports,
};
use super::pipeline;
use super::plugin_options::{CompilerOutputMode, GatingConfig, PluginOptions};
use super::suppression::{
    SuppressionRange, filter_suppressions_that_affect_function, find_program_suppressions,
    suppressions_to_compiler_error,
};

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------

const DEFAULT_ESLINT_SUPPRESSIONS: &[&str] =
    &["react-hooks/exhaustive-deps", "react-hooks/rules-of-hooks"];

/// Directives that opt a function into memoization
const OPT_IN_DIRECTIVES: &[&str] = &["use forget", "use memo"];

/// Directives that opt a function out of memoization
const OPT_OUT_DIRECTIVES: &[&str] = &["use no forget", "use no memo"];

// -----------------------------------------------------------------------
// Internal types
// -----------------------------------------------------------------------

/// A function found in the program that should be compiled
#[allow(dead_code)]
struct CompileSource<'a> {
    kind: CompileSourceKind,
    fn_node: FunctionNode<'a>,
    /// Location of this function in the AST for logging
    fn_name: Option<String>,
    fn_loc: Option<SourceLocation>,
    /// Original AST source location (with index and filename) for logger events.
    fn_ast_loc: Option<react_compiler_ast::common::SourceLocation>,
    fn_start: Option<u32>,
    fn_end: Option<u32>,
    fn_type: ReactFunctionType,
    /// Directives from the function body (for opt-in/opt-out checks)
    body_directives: Vec<Directive>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CompileSourceKind {
    Original,
    #[allow(dead_code)]
    Outlined,
}

// -----------------------------------------------------------------------
// Directive helpers
// -----------------------------------------------------------------------

/// Check if any opt-in directive is present in the given directives.
/// Returns the first matching directive, or None.
///
/// Also checks for dynamic gating directives (`use memo if(...)`)
fn try_find_directive_enabling_memoization<'a>(
    directives: &'a [Directive],
    opts: &PluginOptions,
) -> Result<Option<&'a Directive>, CompilerError> {
    // Check standard opt-in directives
    let opt_in = directives
        .iter()
        .find(|d| OPT_IN_DIRECTIVES.contains(&d.value.value.as_str()));
    if let Some(directive) = opt_in {
        return Ok(Some(directive));
    }

    // Check dynamic gating directives
    match find_directives_dynamic_gating(directives, opts) {
        Ok(Some(result)) => Ok(Some(result.directive)),
        Ok(None) => Ok(None),
        Err(e) => Err(e),
    }
}

/// Check if any opt-out directive is present in the given directives.
fn find_directive_disabling_memoization<'a>(
    directives: &'a [Directive],
    opts: &PluginOptions,
) -> Option<&'a Directive> {
    if let Some(ref custom_directives) = opts.custom_opt_out_directives {
        directives
            .iter()
            .find(|d| custom_directives.contains(&d.value.value))
    } else {
        directives
            .iter()
            .find(|d| OPT_OUT_DIRECTIVES.contains(&d.value.value.as_str()))
    }
}

/// Result of a dynamic gating directive parse.
struct DynamicGatingResult<'a> {
    #[allow(dead_code)]
    directive: &'a Directive,
    gating: GatingConfig,
}

/// Check for dynamic gating directives like `use memo if(identifier)`.
/// Returns the directive and gating config if found, or an error if malformed.
fn find_directives_dynamic_gating<'a>(
    directives: &'a [Directive],
    opts: &PluginOptions,
) -> Result<Option<DynamicGatingResult<'a>>, CompilerError> {
    let dynamic_gating = match &opts.dynamic_gating {
        Some(dg) => dg,
        None => return Ok(None),
    };

    let pattern = Regex::new(r"^use memo if\(([^\)]*)\)$").expect("Invalid dynamic gating regex");

    let mut errors: Vec<CompilerErrorDetail> = Vec::new();
    let mut matches: Vec<(&'a Directive, String)> = Vec::new();

    for directive in directives {
        if let Some(caps) = pattern.captures(&directive.value.value) {
            if let Some(m) = caps.get(1) {
                let ident = m.as_str();
                if is_valid_identifier(ident) {
                    matches.push((directive, ident.to_string()));
                } else {
                    let mut detail = CompilerErrorDetail::new(
                        ErrorCategory::Gating,
                        "Dynamic gating directive is not a valid JavaScript identifier",
                    )
                    .with_description(format!("Found '{}'", directive.value.value));
                    detail.loc = directive.base.loc.as_ref().map(convert_loc);
                    errors.push(detail);
                }
            }
        }
    }

    if !errors.is_empty() {
        let mut err = CompilerError::new();
        for e in errors {
            err.push_error_detail(e);
        }
        return Err(err);
    }

    if matches.len() > 1 {
        let names: Vec<String> = matches.iter().map(|(d, _)| d.value.value.clone()).collect();
        let mut err = CompilerError::new();
        let mut detail = CompilerErrorDetail::new(
            ErrorCategory::Gating,
            "Multiple dynamic gating directives found",
        )
        .with_description(format!(
            "Expected a single directive but found [{}]",
            names.join(", ")
        ));
        detail.loc = matches[0].0.base.loc.as_ref().map(convert_loc);
        err.push_error_detail(detail);
        return Err(err);
    }

    if matches.len() == 1 {
        Ok(Some(DynamicGatingResult {
            directive: matches[0].0,
            gating: GatingConfig {
                source: dynamic_gating.source.clone(),
                import_specifier_name: matches[0].1.clone(),
            },
        }))
    } else {
        Ok(None)
    }
}

/// Simple check for valid JavaScript identifier (alphanumeric + underscore + $, starting with letter/$/_ )
/// Also rejects reserved words like `true`, `false`, `null`, etc.
fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    let mut chars = s.chars();
    let first = chars.next().unwrap();
    if !first.is_alphabetic() && first != '_' && first != '$' {
        return false;
    }
    if !chars.all(|c| c.is_alphanumeric() || c == '_' || c == '$') {
        return false;
    }
    // Check for reserved words (matching Babel's t.isValidIdentifier)
    !matches!(s,
        "break" | "case" | "catch" | "continue" | "debugger" | "default" | "do" |
        "else" | "finally" | "for" | "function" | "if" | "in" | "instanceof" |
        "new" | "return" | "switch" | "this" | "throw" | "try" | "typeof" |
        "var" | "void" | "while" | "with" | "class" | "const" | "enum" |
        "export" | "extends" | "import" | "super" | "implements" | "interface" |
        "let" | "package" | "private" | "protected" | "public" | "static" |
        "yield" | "null" | "true" | "false" | "delete"
    )
}

// -----------------------------------------------------------------------
// Name helpers
// -----------------------------------------------------------------------

/// Check if a string follows the React hook naming convention (use[A-Z0-9]...).
fn is_hook_name(s: &str) -> bool {
    let bytes = s.as_bytes();
    bytes.len() >= 4
        && bytes[0] == b'u'
        && bytes[1] == b's'
        && bytes[2] == b'e'
        && bytes
            .get(3)
            .map_or(false, |c| c.is_ascii_uppercase() || c.is_ascii_digit())
}

/// Check if a name looks like a React component (starts with uppercase letter).
fn is_component_name(name: &str) -> bool {
    name.chars()
        .next()
        .map_or(false, |c| c.is_ascii_uppercase())
}

/// Check if an expression is a hook call (identifier with hook name, or
/// member expression `PascalCase.useHook`).
fn expr_is_hook(expr: &Expression) -> bool {
    match expr {
        Expression::Identifier(id) => is_hook_name(&id.name),
        Expression::MemberExpression(member) => {
            if member.computed {
                return false;
            }
            // Property must be a hook name
            if !expr_is_hook(&member.property) {
                return false;
            }
            // Object must be a PascalCase identifier
            if let Expression::Identifier(obj) = member.object.as_ref() {
                obj.name
                    .chars()
                    .next()
                    .map_or(false, |c| c.is_ascii_uppercase())
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Check if an expression is a React API call (e.g., `forwardRef` or `React.forwardRef`).
#[allow(dead_code)]
fn is_react_api(expr: &Expression, function_name: &str) -> bool {
    match expr {
        Expression::Identifier(id) => id.name == function_name,
        Expression::MemberExpression(member) => {
            if let Expression::Identifier(obj) = member.object.as_ref() {
                if obj.name == "React" {
                    if let Expression::Identifier(prop) = member.property.as_ref() {
                        return prop.name == function_name;
                    }
                }
            }
            false
        }
        _ => false,
    }
}

/// Get the inferred function name from a function's context.
///
/// For FunctionDeclaration: uses the `id` field.
/// For FunctionExpression/ArrowFunctionExpression: infers from parent context
/// (VariableDeclarator, etc.) which is passed explicitly since we don't have Babel paths.
fn get_function_name_from_id(id: Option<&Identifier>) -> Option<String> {
    id.map(|id| id.name.clone())
}

// -----------------------------------------------------------------------
// AST traversal helpers
// -----------------------------------------------------------------------

/// Check if an expression is a "non-node" return value (indicating the function
/// is not a React component). This matches the TS `isNonNode` function.
fn is_non_node(expr: &Expression) -> bool {
    matches!(
        expr,
        Expression::ObjectExpression(_)
            | Expression::ArrowFunctionExpression(_)
            | Expression::FunctionExpression(_)
            | Expression::BigIntLiteral(_)
            | Expression::ClassExpression(_)
            | Expression::NewExpression(_)
    )
}

/// Recursively check if a function body returns a non-React-node value.
/// Walks all return statements in the function (not in nested functions).
fn returns_non_node_in_stmts(stmts: &[Statement]) -> bool {
    for stmt in stmts {
        if returns_non_node_in_stmt(stmt) {
            return true;
        }
    }
    false
}

fn returns_non_node_in_stmt(stmt: &Statement) -> bool {
    match stmt {
        Statement::ReturnStatement(ret) => {
            if let Some(ref arg) = ret.argument {
                return is_non_node(arg);
            }
            false
        }
        Statement::BlockStatement(block) => returns_non_node_in_stmts(&block.body),
        Statement::IfStatement(if_stmt) => {
            returns_non_node_in_stmt(&if_stmt.consequent)
                || if_stmt
                    .alternate
                    .as_ref()
                    .map_or(false, |alt| returns_non_node_in_stmt(alt))
        }
        Statement::ForStatement(for_stmt) => returns_non_node_in_stmt(&for_stmt.body),
        Statement::WhileStatement(while_stmt) => returns_non_node_in_stmt(&while_stmt.body),
        Statement::DoWhileStatement(do_while) => returns_non_node_in_stmt(&do_while.body),
        Statement::ForInStatement(for_in) => returns_non_node_in_stmt(&for_in.body),
        Statement::ForOfStatement(for_of) => returns_non_node_in_stmt(&for_of.body),
        Statement::SwitchStatement(switch) => {
            for case in &switch.cases {
                if returns_non_node_in_stmts(&case.consequent) {
                    return true;
                }
            }
            false
        }
        Statement::TryStatement(try_stmt) => {
            if returns_non_node_in_stmts(&try_stmt.block.body) {
                return true;
            }
            if let Some(ref handler) = try_stmt.handler {
                if returns_non_node_in_stmts(&handler.body.body) {
                    return true;
                }
            }
            if let Some(ref finalizer) = try_stmt.finalizer {
                if returns_non_node_in_stmts(&finalizer.body) {
                    return true;
                }
            }
            false
        }
        Statement::LabeledStatement(labeled) => returns_non_node_in_stmt(&labeled.body),
        Statement::WithStatement(with) => returns_non_node_in_stmt(&with.body),
        // Skip nested function/class declarations -- they have their own returns
        Statement::FunctionDeclaration(_) | Statement::ClassDeclaration(_) => false,
        _ => false,
    }
}

/// Check if a function returns non-node values.
/// For arrow functions with expression body, checks the expression directly.
/// For block bodies, walks the statements.
fn returns_non_node_fn(params: &[PatternLike], body: &FunctionBody) -> bool {
    let _ = params;
    match body {
        FunctionBody::Block(block) => returns_non_node_in_stmts(&block.body),
        FunctionBody::Expression(expr) => is_non_node(expr),
    }
}

/// Check if a function body calls hooks or creates JSX.
/// Traverses the function body (not nested functions) looking for:
/// - CallExpression where callee is a hook
/// - JSXElement or JSXFragment
fn calls_hooks_or_creates_jsx_in_stmts(stmts: &[Statement]) -> bool {
    for stmt in stmts {
        if calls_hooks_or_creates_jsx_in_stmt(stmt) {
            return true;
        }
    }
    false
}

fn calls_hooks_or_creates_jsx_in_stmt(stmt: &Statement) -> bool {
    match stmt {
        Statement::ExpressionStatement(expr_stmt) => {
            calls_hooks_or_creates_jsx_in_expr(&expr_stmt.expression)
        }
        Statement::ReturnStatement(ret) => {
            if let Some(ref arg) = ret.argument {
                calls_hooks_or_creates_jsx_in_expr(arg)
            } else {
                false
            }
        }
        Statement::VariableDeclaration(var_decl) => {
            for decl in &var_decl.declarations {
                if let Some(ref init) = decl.init {
                    if calls_hooks_or_creates_jsx_in_expr(init) {
                        return true;
                    }
                }
            }
            false
        }
        Statement::BlockStatement(block) => calls_hooks_or_creates_jsx_in_stmts(&block.body),
        Statement::IfStatement(if_stmt) => {
            calls_hooks_or_creates_jsx_in_expr(&if_stmt.test)
                || calls_hooks_or_creates_jsx_in_stmt(&if_stmt.consequent)
                || if_stmt
                    .alternate
                    .as_ref()
                    .map_or(false, |alt| calls_hooks_or_creates_jsx_in_stmt(alt))
        }
        Statement::ForStatement(for_stmt) => {
            if let Some(ref init) = for_stmt.init {
                match init.as_ref() {
                    ForInit::Expression(expr) => {
                        if calls_hooks_or_creates_jsx_in_expr(expr) {
                            return true;
                        }
                    }
                    ForInit::VariableDeclaration(var_decl) => {
                        for decl in &var_decl.declarations {
                            if let Some(ref init) = decl.init {
                                if calls_hooks_or_creates_jsx_in_expr(init) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
            if let Some(ref test) = for_stmt.test {
                if calls_hooks_or_creates_jsx_in_expr(test) {
                    return true;
                }
            }
            if let Some(ref update) = for_stmt.update {
                if calls_hooks_or_creates_jsx_in_expr(update) {
                    return true;
                }
            }
            calls_hooks_or_creates_jsx_in_stmt(&for_stmt.body)
        }
        Statement::WhileStatement(while_stmt) => {
            calls_hooks_or_creates_jsx_in_expr(&while_stmt.test)
                || calls_hooks_or_creates_jsx_in_stmt(&while_stmt.body)
        }
        Statement::DoWhileStatement(do_while) => {
            calls_hooks_or_creates_jsx_in_stmt(&do_while.body)
                || calls_hooks_or_creates_jsx_in_expr(&do_while.test)
        }
        Statement::ForInStatement(for_in) => {
            calls_hooks_or_creates_jsx_in_expr(&for_in.right)
                || calls_hooks_or_creates_jsx_in_stmt(&for_in.body)
        }
        Statement::ForOfStatement(for_of) => {
            calls_hooks_or_creates_jsx_in_expr(&for_of.right)
                || calls_hooks_or_creates_jsx_in_stmt(&for_of.body)
        }
        Statement::SwitchStatement(switch) => {
            if calls_hooks_or_creates_jsx_in_expr(&switch.discriminant) {
                return true;
            }
            for case in &switch.cases {
                if let Some(ref test) = case.test {
                    if calls_hooks_or_creates_jsx_in_expr(test) {
                        return true;
                    }
                }
                if calls_hooks_or_creates_jsx_in_stmts(&case.consequent) {
                    return true;
                }
            }
            false
        }
        Statement::ThrowStatement(throw) => calls_hooks_or_creates_jsx_in_expr(&throw.argument),
        Statement::TryStatement(try_stmt) => {
            if calls_hooks_or_creates_jsx_in_stmts(&try_stmt.block.body) {
                return true;
            }
            if let Some(ref handler) = try_stmt.handler {
                if calls_hooks_or_creates_jsx_in_stmts(&handler.body.body) {
                    return true;
                }
            }
            if let Some(ref finalizer) = try_stmt.finalizer {
                if calls_hooks_or_creates_jsx_in_stmts(&finalizer.body) {
                    return true;
                }
            }
            false
        }
        Statement::LabeledStatement(labeled) => calls_hooks_or_creates_jsx_in_stmt(&labeled.body),
        Statement::WithStatement(with) => {
            calls_hooks_or_creates_jsx_in_expr(&with.object)
                || calls_hooks_or_creates_jsx_in_stmt(&with.body)
        }
        // Skip nested function/class declarations
        Statement::FunctionDeclaration(_) | Statement::ClassDeclaration(_) => false,
        _ => false,
    }
}

fn calls_hooks_or_creates_jsx_in_expr(expr: &Expression) -> bool {
    match expr {
        // JSX creates
        Expression::JSXElement(_) | Expression::JSXFragment(_) => true,

        // Hook calls
        Expression::CallExpression(call) => {
            if expr_is_hook(&call.callee) {
                return true;
            }
            // Also check arguments for JSX/hooks (but not nested functions)
            if calls_hooks_or_creates_jsx_in_expr(&call.callee) {
                return true;
            }
            for arg in &call.arguments {
                // Skip function arguments -- they are nested functions
                if matches!(
                    arg,
                    Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
                ) {
                    continue;
                }
                if calls_hooks_or_creates_jsx_in_expr(arg) {
                    return true;
                }
            }
            false
        }
        Expression::OptionalCallExpression(call) => {
            // Note: OptionalCallExpression is NOT treated as a hook call for
            // the purpose of determining function type. The TS code only checks
            // regular CallExpression nodes in callsHooksOrCreatesJsx.
            // We still recurse into the callee and arguments to find other
            // hook calls or JSX.
            if calls_hooks_or_creates_jsx_in_expr(&call.callee) {
                return true;
            }
            for arg in &call.arguments {
                if matches!(
                    arg,
                    Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
                ) {
                    continue;
                }
                if calls_hooks_or_creates_jsx_in_expr(arg) {
                    return true;
                }
            }
            false
        }

        // Binary/logical
        Expression::BinaryExpression(bin) => {
            calls_hooks_or_creates_jsx_in_expr(&bin.left)
                || calls_hooks_or_creates_jsx_in_expr(&bin.right)
        }
        Expression::LogicalExpression(log) => {
            calls_hooks_or_creates_jsx_in_expr(&log.left)
                || calls_hooks_or_creates_jsx_in_expr(&log.right)
        }
        Expression::ConditionalExpression(cond) => {
            calls_hooks_or_creates_jsx_in_expr(&cond.test)
                || calls_hooks_or_creates_jsx_in_expr(&cond.consequent)
                || calls_hooks_or_creates_jsx_in_expr(&cond.alternate)
        }
        Expression::AssignmentExpression(assign) => {
            calls_hooks_or_creates_jsx_in_expr(&assign.right)
        }
        Expression::SequenceExpression(seq) => seq
            .expressions
            .iter()
            .any(|e| calls_hooks_or_creates_jsx_in_expr(e)),
        Expression::UnaryExpression(unary) => calls_hooks_or_creates_jsx_in_expr(&unary.argument),
        Expression::UpdateExpression(update) => {
            calls_hooks_or_creates_jsx_in_expr(&update.argument)
        }
        Expression::MemberExpression(member) => {
            calls_hooks_or_creates_jsx_in_expr(&member.object)
                || calls_hooks_or_creates_jsx_in_expr(&member.property)
        }
        Expression::OptionalMemberExpression(member) => {
            calls_hooks_or_creates_jsx_in_expr(&member.object)
                || calls_hooks_or_creates_jsx_in_expr(&member.property)
        }
        Expression::SpreadElement(spread) => calls_hooks_or_creates_jsx_in_expr(&spread.argument),
        Expression::AwaitExpression(await_expr) => {
            calls_hooks_or_creates_jsx_in_expr(&await_expr.argument)
        }
        Expression::YieldExpression(yield_expr) => yield_expr
            .argument
            .as_ref()
            .map_or(false, |arg| calls_hooks_or_creates_jsx_in_expr(arg)),
        Expression::TaggedTemplateExpression(tagged) => {
            calls_hooks_or_creates_jsx_in_expr(&tagged.tag)
        }
        Expression::TemplateLiteral(tl) => tl
            .expressions
            .iter()
            .any(|e| calls_hooks_or_creates_jsx_in_expr(e)),
        Expression::ArrayExpression(arr) => arr.elements.iter().any(|e| {
            e.as_ref()
                .map_or(false, |e| calls_hooks_or_creates_jsx_in_expr(e))
        }),
        Expression::ObjectExpression(obj) => obj.properties.iter().any(|prop| match prop {
            ObjectExpressionProperty::ObjectProperty(p) => {
                calls_hooks_or_creates_jsx_in_expr(&p.value)
            }
            ObjectExpressionProperty::SpreadElement(s) => {
                calls_hooks_or_creates_jsx_in_expr(&s.argument)
            }
            // ObjectMethod: traverse into its body to find hooks/JSX.
            // This matches the TS behavior where Babel's traverse enters
            // ObjectMethod (only FunctionDeclaration, FunctionExpression,
            // and ArrowFunctionExpression are skipped).
            ObjectExpressionProperty::ObjectMethod(m) => {
                calls_hooks_or_creates_jsx_in_stmts(&m.body.body)
            }
        }),
        Expression::ParenthesizedExpression(paren) => {
            calls_hooks_or_creates_jsx_in_expr(&paren.expression)
        }
        Expression::TSAsExpression(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSSatisfiesExpression(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSNonNullExpression(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSTypeAssertion(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSInstantiationExpression(ts) => {
            calls_hooks_or_creates_jsx_in_expr(&ts.expression)
        }
        Expression::TypeCastExpression(tc) => calls_hooks_or_creates_jsx_in_expr(&tc.expression),
        Expression::NewExpression(new) => {
            if calls_hooks_or_creates_jsx_in_expr(&new.callee) {
                return true;
            }
            new.arguments.iter().any(|a| {
                if matches!(
                    a,
                    Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
                ) {
                    return false;
                }
                calls_hooks_or_creates_jsx_in_expr(a)
            })
        }

        // Skip nested functions
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => false,

        // Leaf expressions
        _ => false,
    }
}

/// Check if a function body calls hooks or creates JSX.
fn calls_hooks_or_creates_jsx(body: &FunctionBody) -> bool {
    match body {
        FunctionBody::Block(block) => calls_hooks_or_creates_jsx_in_stmts(&block.body),
        FunctionBody::Expression(expr) => calls_hooks_or_creates_jsx_in_expr(expr),
    }
}

/// Check if the function parameters are valid for a React component.
/// Components can have 0 params, 1 param (props), or 2 params (props + ref).
/// Check if a parameter's type annotation is valid for a React component prop.
/// Returns false for primitive type annotations that indicate this is NOT a component.
fn is_valid_props_annotation(param: &PatternLike) -> bool {
    let type_annotation = match param {
        PatternLike::Identifier(id) => id.type_annotation.as_deref(),
        PatternLike::ObjectPattern(op) => op.type_annotation.as_deref(),
        PatternLike::ArrayPattern(ap) => ap.type_annotation.as_deref(),
        PatternLike::AssignmentPattern(ap) => ap.type_annotation.as_deref(),
        PatternLike::RestElement(re) => re.type_annotation.as_deref(),
        PatternLike::MemberExpression(_) => None,
    };
    let annot = match type_annotation {
        Some(val) => val,
        None => return true, // No annotation = valid
    };
    let annot_type = match annot.get("type").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => return true,
    };
    match annot_type {
        "TSTypeAnnotation" => {
            let inner_type = annot.get("typeAnnotation")
                .and_then(|v| v.get("type"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            !matches!(inner_type,
                "TSArrayType" | "TSBigIntKeyword" | "TSBooleanKeyword"
                | "TSConstructorType" | "TSFunctionType" | "TSLiteralType"
                | "TSNeverKeyword" | "TSNumberKeyword" | "TSStringKeyword"
                | "TSSymbolKeyword" | "TSTupleType"
            )
        }
        "TypeAnnotation" => {
            let inner_type = annot.get("typeAnnotation")
                .and_then(|v| v.get("type"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            !matches!(inner_type,
                "ArrayTypeAnnotation" | "BooleanLiteralTypeAnnotation"
                | "BooleanTypeAnnotation" | "EmptyTypeAnnotation"
                | "FunctionTypeAnnotation" | "NullLiteralTypeAnnotation"
                | "NumberLiteralTypeAnnotation" | "NumberTypeAnnotation"
                | "StringLiteralTypeAnnotation" | "StringTypeAnnotation"
                | "SymbolTypeAnnotation" | "ThisTypeAnnotation"
                | "TupleTypeAnnotation"
            )
        }
        "Noop" => true,
        _ => true,
    }
}

fn is_valid_component_params(params: &[PatternLike]) -> bool {
    if params.is_empty() {
        return true;
    }
    if params.len() > 2 {
        return false;
    }
    // First param cannot be a rest element
    if matches!(params[0], PatternLike::RestElement(_)) {
        return false;
    }
    // Check type annotation on first param
    if !is_valid_props_annotation(&params[0]) {
        return false;
    }
    if params.len() == 1 {
        return true;
    }
    // If second param exists, it should look like a ref
    if let PatternLike::Identifier(ref id) = params[1] {
        id.name.contains("ref") || id.name.contains("Ref")
    } else {
        false
    }
}

// -----------------------------------------------------------------------
// Unified function body type for traversal
// -----------------------------------------------------------------------

/// Abstraction over function body types to simplify traversal code
enum FunctionBody<'a> {
    Block(&'a BlockStatement),
    Expression(&'a Expression),
}

// -----------------------------------------------------------------------
// Function type detection
// -----------------------------------------------------------------------

/// Determine the React function type for a function, given the compilation mode
/// and the function's name and context.
///
/// This is the Rust equivalent of `getReactFunctionType` in Program.ts.
fn get_react_function_type(
    name: Option<&str>,
    params: &[PatternLike],
    body: &FunctionBody,
    body_directives: &[Directive],
    is_declaration: bool,
    parent_callee_name: Option<&str>,
    opts: &PluginOptions,
) -> Option<ReactFunctionType> {
    // Check for opt-in directives in the function body
    if let FunctionBody::Block(_) = body {
        let opt_in = try_find_directive_enabling_memoization(body_directives, opts);
        if let Ok(Some(_)) = opt_in {
            // If there's an opt-in directive, use name heuristics but fall back to Other
            return Some(
                get_component_or_hook_like(name, params, body, parent_callee_name)
                    .unwrap_or(ReactFunctionType::Other),
            );
        }
    }

    // Component and hook declarations are known components/hooks
    // (In the TS version, this uses isComponentDeclaration/isHookDeclaration
    //  which check for the `component` and `hook` keywords in the syntax.
    //  Since standard JS doesn't have these, we skip this for now.)

    match opts.compilation_mode.as_str() {
        "annotation" => {
            // opt-ins were checked above
            None
        }
        "infer" => get_component_or_hook_like(name, params, body, parent_callee_name),
        "syntax" => {
            // In syntax mode, only compile declared components/hooks
            // Since we don't have component/hook syntax support yet, return None
            let _ = is_declaration;
            None
        }
        "all" => Some(
            get_component_or_hook_like(name, params, body, parent_callee_name)
                .unwrap_or(ReactFunctionType::Other),
        ),
        _ => None,
    }
}

/// Determine if a function looks like a React component or hook based on
/// naming conventions and code patterns.
///
/// Adapted from the ESLint rule at
/// https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js
fn get_component_or_hook_like(
    name: Option<&str>,
    params: &[PatternLike],
    body: &FunctionBody,
    parent_callee_name: Option<&str>,
) -> Option<ReactFunctionType> {
    if let Some(fn_name) = name {
        if is_component_name(fn_name) {
            // Check if it actually looks like a component
            let is_component = calls_hooks_or_creates_jsx(body)
                && is_valid_component_params(params)
                && !returns_non_node_fn(params, body);
            return if is_component {
                Some(ReactFunctionType::Component)
            } else {
                None
            };
        } else if is_hook_name(fn_name) {
            // Hooks have hook invocations or JSX, but can take any # of arguments
            return if calls_hooks_or_creates_jsx(body) {
                Some(ReactFunctionType::Hook)
            } else {
                None
            };
        }
    }

    // For unnamed functions, check if they are forwardRef/memo callbacks
    if let Some(callee_name) = parent_callee_name {
        if callee_name == "forwardRef" || callee_name == "memo" {
            return if calls_hooks_or_creates_jsx(body) {
                Some(ReactFunctionType::Component)
            } else {
                None
            };
        }
    }

    None
}

/// Extract the callee name from a CallExpression if it's a React API call
/// (forwardRef, memo, React.forwardRef, React.memo).
fn get_callee_name_if_react_api(callee: &Expression) -> Option<&str> {
    match callee {
        Expression::Identifier(id) => {
            if id.name == "forwardRef" || id.name == "memo" {
                Some(&id.name)
            } else {
                None
            }
        }
        Expression::MemberExpression(member) => {
            if let Expression::Identifier(obj) = member.object.as_ref() {
                if obj.name == "React" {
                    if let Expression::Identifier(prop) = member.property.as_ref() {
                        if prop.name == "forwardRef" || prop.name == "memo" {
                            return Some(&prop.name);
                        }
                    }
                }
            }
            None
        }
        _ => None,
    }
}

// -----------------------------------------------------------------------
// SourceLocation conversion
// -----------------------------------------------------------------------

/// Convert an AST SourceLocation to a diagnostics SourceLocation
fn convert_loc(loc: &react_compiler_ast::common::SourceLocation) -> SourceLocation {
    SourceLocation {
        start: react_compiler_diagnostics::Position {
            line: loc.start.line,
            column: loc.start.column,
            index: loc.start.index,
        },
        end: react_compiler_diagnostics::Position {
            line: loc.end.line,
            column: loc.end.column,
            index: loc.end.index,
        },
    }
}

fn base_node_loc(base: &BaseNode) -> Option<SourceLocation> {
    base.loc.as_ref().map(convert_loc)
}

// -----------------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------------

/// Convert CompilerDiagnostic details into serializable CompilerErrorItemInfo items.
fn diagnostic_details_to_items(
    d: &react_compiler_diagnostics::CompilerDiagnostic,
    filename: Option<&str>,
) -> Option<Vec<CompilerErrorItemInfo>> {
    let items: Vec<CompilerErrorItemInfo> = d
        .details
        .iter()
        .map(|item| match item {
            react_compiler_diagnostics::CompilerDiagnosticDetail::Error { loc, message } => {
                CompilerErrorItemInfo {
                    kind: "error".to_string(),
                    loc: loc.as_ref().map(|l| diag_loc_to_logger_loc(l, filename)),
                    message: message.clone(),
                }
            }
            react_compiler_diagnostics::CompilerDiagnosticDetail::Hint { message } => {
                CompilerErrorItemInfo {
                    kind: "hint".to_string(),
                    loc: None,
                    message: Some(message.clone()),
                }
            }
        })
        .collect();
    if items.is_empty() { None } else { Some(items) }
}

/// Convert an optional AST SourceLocation to a LoggerSourceLocation with filename.
fn to_logger_loc(
    ast_loc: Option<&react_compiler_ast::common::SourceLocation>,
    filename: Option<&str>,
) -> Option<LoggerSourceLocation> {
    ast_loc.map(|loc| LoggerSourceLocation {
        start: LoggerPosition {
            line: loc.start.line,
            column: loc.start.column,
            index: loc.start.index,
        },
        end: LoggerPosition {
            line: loc.end.line,
            column: loc.end.column,
            index: loc.end.index,
        },
        filename: filename.map(|s| s.to_string()),
    })
}

/// Convert a diagnostics SourceLocation to a LoggerSourceLocation with filename.
fn diag_loc_to_logger_loc(
    loc: &SourceLocation,
    filename: Option<&str>,
) -> LoggerSourceLocation {
    LoggerSourceLocation {
        start: LoggerPosition {
            line: loc.start.line,
            column: loc.start.column,
            index: loc.start.index,
        },
        end: LoggerPosition {
            line: loc.end.line,
            column: loc.end.column,
            index: loc.end.index,
        },
        filename: filename.map(|s| s.to_string()),
    }
}

/// Log an error as LoggerEvent(s) directly onto the ProgramContext.
fn log_error(
    err: &CompilerError,
    fn_ast_loc: Option<&react_compiler_ast::common::SourceLocation>,
    context: &mut ProgramContext,
) {
    // Use the filename from the AST node's loc (set by parser's sourceFilename option),
    // not from plugin options (which may have a different prefix like '/').
    let source_filename = fn_ast_loc.and_then(|loc| loc.filename.as_deref());
    let fn_loc = to_logger_loc(fn_ast_loc, source_filename);
    for detail in &err.details {
        match detail {
            CompilerErrorOrDiagnostic::Diagnostic(d) => {
                context.log_event(LoggerEvent::CompileError {
                    fn_loc: fn_loc.clone(),
                    detail: CompilerErrorDetailInfo {
                        category: format!("{:?}", d.category),
                        reason: d.reason.clone(),
                        description: d.description.clone(),
                        severity: format!("{:?}", d.severity()),
                        suggestions: None,
                        details: diagnostic_details_to_items(d, source_filename),
                        loc: None,
                    },
                });
            }
            CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                context.log_event(LoggerEvent::CompileError {
                    fn_loc: fn_loc.clone(),
                    detail: CompilerErrorDetailInfo {
                        category: format!("{:?}", d.category),
                        reason: d.reason.clone(),
                        description: d.description.clone(),
                        severity: format!("{:?}", d.severity()),
                        suggestions: None,
                        details: None,
                        loc: d.loc.as_ref().map(|l| diag_loc_to_logger_loc(l, source_filename)),
                    },
                });
            }
        }
    }
}

/// Handle an error according to the panicThreshold setting.
/// Returns Some(CompileResult::Error) if the error should be surfaced as fatal,
/// otherwise returns None (error was logged only).
fn handle_error(
    err: &CompilerError,
    fn_ast_loc: Option<&react_compiler_ast::common::SourceLocation>,
    context: &mut ProgramContext,
) -> Option<CompileResult> {
    // Log the error
    log_error(err, fn_ast_loc, context);

    let should_panic = match context.opts.panic_threshold.as_str() {
        "all_errors" => true,
        "critical_errors" => err.has_errors(),
        _ => false,
    };

    // Config errors always cause a panic
    let is_config_error = err.details.iter().any(|d| match d {
        CompilerErrorOrDiagnostic::Diagnostic(d) => d.category == ErrorCategory::Config,
        CompilerErrorOrDiagnostic::ErrorDetail(d) => d.category == ErrorCategory::Config,
    });

    if should_panic || is_config_error {
        let error_info = compiler_error_to_info(err, context.filename.as_deref());
        Some(CompileResult::Error {
            error: error_info,
            events: context.events.clone(),
            ordered_log: context.ordered_log.clone(),
            timing: Vec::new(),
        })
    } else {
        None
    }
}

/// Convert a diagnostics CompilerError to a serializable CompilerErrorInfo.
fn compiler_error_to_info(err: &CompilerError, filename: Option<&str>) -> CompilerErrorInfo {
    let details: Vec<CompilerErrorDetailInfo> = err
        .details
        .iter()
        .map(|d| match d {
            CompilerErrorOrDiagnostic::Diagnostic(d) => CompilerErrorDetailInfo {
                category: format!("{:?}", d.category),
                reason: d.reason.clone(),
                description: d.description.clone(),
                severity: format!("{:?}", d.severity()),
                suggestions: None,
                details: diagnostic_details_to_items(d, filename),
                loc: None,
            },
            CompilerErrorOrDiagnostic::ErrorDetail(d) => CompilerErrorDetailInfo {
                category: format!("{:?}", d.category),
                reason: d.reason.clone(),
                description: d.description.clone(),
                severity: format!("{:?}", d.severity()),
                suggestions: None,
                details: None,
                loc: d.loc.as_ref().map(|l| diag_loc_to_logger_loc(l, filename)),
            },
        })
        .collect();

    let (reason, description) = details
        .first()
        .map(|d| (d.reason.clone(), d.description.clone()))
        .unwrap_or_else(|| ("Unknown error".to_string(), None));

    CompilerErrorInfo {
        reason,
        description,
        details,
    }
}

// -----------------------------------------------------------------------
// Compilation pipeline stubs
// -----------------------------------------------------------------------

/// Attempt to compile a single function.
///
/// Returns `CodegenFunction` on success or `CompilerError` on failure.
/// Debug log entries are accumulated on `context.debug_logs`.
fn try_compile_function(
    source: &CompileSource<'_>,
    scope_info: &ScopeInfo,
    output_mode: CompilerOutputMode,
    env_config: &EnvironmentConfig,
    context: &mut ProgramContext,
) -> Result<CodegenFunction, CompilerError> {
    // Check for suppressions that affect this function
    if let (Some(start), Some(end)) = (source.fn_start, source.fn_end) {
        let affecting = filter_suppressions_that_affect_function(&context.suppressions, start, end);
        if !affecting.is_empty() {
            let owned: Vec<SuppressionRange> = affecting.into_iter().cloned().collect();
            return Err(suppressions_to_compiler_error(&owned));
        }
    }

    // Run the compilation pipeline
    pipeline::compile_fn(
        &source.fn_node,
        source.fn_name.as_deref(),
        scope_info,
        source.fn_type,
        output_mode,
        env_config,
        context,
    )
}

/// Process a single function: check directives, attempt compilation, handle results.
///
/// Returns `Ok(Some(codegen_fn))` when the function was compiled and should be applied,
/// `Ok(None)` when the function was skipped or lint-only,
/// or `Err(CompileResult)` if a fatal error should short-circuit the program.
fn process_fn(
    source: &CompileSource<'_>,
    scope_info: &ScopeInfo,
    output_mode: CompilerOutputMode,
    env_config: &EnvironmentConfig,
    context: &mut ProgramContext,
) -> Result<Option<CodegenFunction>, CompileResult> {
    // Parse directives from the function body
    let opt_in_result =
        try_find_directive_enabling_memoization(&source.body_directives, &context.opts);
    let opt_out = find_directive_disabling_memoization(&source.body_directives, &context.opts);

    // If parsing opt-in directive fails, handle the error and skip
    let opt_in = match opt_in_result {
        Ok(d) => d,
        Err(err) => {
            // Apply panic threshold logic (same as compilation errors)
            if let Some(result) = handle_error(&err, source.fn_ast_loc.as_ref(), context) {
                return Err(result);
            }
            return Ok(None);
        }
    };

    // Attempt compilation
    let compile_result = try_compile_function(source, scope_info, output_mode, env_config, context);

    match compile_result {
        Err(err) => {
            if opt_out.is_some() {
                // If there's an opt-out, just log the error (don't escalate)
                log_error(&err, source.fn_ast_loc.as_ref(), context);
            } else {
                // Apply panic threshold logic
                if let Some(result) = handle_error(&err, source.fn_ast_loc.as_ref(), context) {
                    return Err(result);
                }
            }
            Ok(None)
        }
        Ok(codegen_fn) => {
            // Check opt-out
            if !context.opts.ignore_use_no_forget && opt_out.is_some() {
                let opt_out_value = &opt_out.unwrap().value.value;
                let source_filename = source.fn_ast_loc.as_ref().and_then(|loc| loc.filename.as_deref());
                context.log_event(LoggerEvent::CompileSkip {
                    fn_loc: to_logger_loc(source.fn_ast_loc.as_ref(), source_filename),
                    reason: format!("Skipped due to '{}' directive.", opt_out_value),
                    loc: opt_out.and_then(|d| to_logger_loc(d.base.loc.as_ref(), source_filename)),
                });
                // Even though the function is skipped, register the memo cache import
                // if the compiled function had memo slots. This matches TS behavior where
                // addMemoCacheImport() is called during codegen as a side effect that
                // persists even when the function is later skipped.
                if codegen_fn.memo_slots_used > 0 {
                    context.add_memo_cache_import();
                }
                return Ok(None);
            }

            // Log success with memo stats from CodegenFunction
            let source_filename = source.fn_ast_loc.as_ref().and_then(|loc| loc.filename.as_deref());
            context.log_event(LoggerEvent::CompileSuccess {
                fn_loc: to_logger_loc(source.fn_ast_loc.as_ref(), source_filename),
                fn_name: source.fn_name.clone(),
                memo_slots: codegen_fn.memo_slots_used,
                memo_blocks: codegen_fn.memo_blocks,
                memo_values: codegen_fn.memo_values,
                pruned_memo_blocks: codegen_fn.pruned_memo_blocks,
                pruned_memo_values: codegen_fn.pruned_memo_values,
            });

            // Check module scope opt-out
            if context.has_module_scope_opt_out {
                return Ok(None);
            }

            // Check output mode — lint mode doesn't apply compiled functions
            if output_mode == CompilerOutputMode::Lint {
                return Ok(None);
            }

            // Check annotation mode
            if context.opts.compilation_mode == "annotation" && opt_in.is_none() {
                return Ok(None);
            }

            Ok(Some(codegen_fn))
        }
    }
}

// -----------------------------------------------------------------------
// Import checking
// -----------------------------------------------------------------------

/// Check if the program already has a `c` import from the React Compiler runtime module.
/// If so, the file was already compiled and should be skipped.
fn has_memo_cache_function_import(program: &Program, module_name: &str) -> bool {
    for stmt in &program.body {
        if let Statement::ImportDeclaration(import) = stmt {
            if import.source.value == module_name {
                for specifier in &import.specifiers {
                    if let ImportSpecifier::ImportSpecifier(data) = specifier {
                        let imported_name = match &data.imported {
                            ModuleExportName::Identifier(id) => &id.name,
                            ModuleExportName::StringLiteral(s) => &s.value,
                        };
                        if imported_name == "c" {
                            return true;
                        }
                    }
                }
            }
        }
    }
    false
}

/// Check if compilation should be skipped for this program.
fn should_skip_compilation(program: &Program, options: &PluginOptions) -> bool {
    let runtime_module = get_react_compiler_runtime_module(&options.target);
    has_memo_cache_function_import(program, &runtime_module)
}

// -----------------------------------------------------------------------
// Function discovery
// -----------------------------------------------------------------------

/// Information about an expression that might be a function to compile
struct FunctionInfo<'a> {
    name: Option<String>,
    fn_node: FunctionNode<'a>,
    params: &'a [PatternLike],
    body: FunctionBody<'a>,
    body_directives: Vec<Directive>,
    base: &'a BaseNode,
    parent_callee_name: Option<String>,
}

/// Extract function info from a FunctionDeclaration
fn fn_info_from_decl(decl: &FunctionDeclaration) -> FunctionInfo<'_> {
    FunctionInfo {
        name: get_function_name_from_id(decl.id.as_ref()),
        fn_node: FunctionNode::FunctionDeclaration(decl),
        params: &decl.params,
        body: FunctionBody::Block(&decl.body),
        body_directives: decl.body.directives.clone(),
        base: &decl.base,
        parent_callee_name: None,
    }
}

/// Extract function info from a FunctionExpression
fn fn_info_from_func_expr<'a>(
    expr: &'a FunctionExpression,
    inferred_name: Option<String>,
    parent_callee_name: Option<String>,
) -> FunctionInfo<'a> {
    FunctionInfo {
        name: expr.id.as_ref().map(|id| id.name.clone()).or(inferred_name),
        fn_node: FunctionNode::FunctionExpression(expr),
        params: &expr.params,
        body: FunctionBody::Block(&expr.body),
        body_directives: expr.body.directives.clone(),
        base: &expr.base,
        parent_callee_name,
    }
}

/// Extract function info from an ArrowFunctionExpression
fn fn_info_from_arrow<'a>(
    expr: &'a ArrowFunctionExpression,
    inferred_name: Option<String>,
    parent_callee_name: Option<String>,
) -> FunctionInfo<'a> {
    let (body, directives) = match expr.body.as_ref() {
        ArrowFunctionBody::BlockStatement(block) => {
            (FunctionBody::Block(block), block.directives.clone())
        }
        ArrowFunctionBody::Expression(e) => (FunctionBody::Expression(e), Vec::new()),
    };
    FunctionInfo {
        name: inferred_name,
        fn_node: FunctionNode::ArrowFunctionExpression(expr),
        params: &expr.params,
        body,
        body_directives: directives,
        base: &expr.base,
        parent_callee_name,
    }
}

/// Try to create a CompileSource from function info
fn try_make_compile_source<'a>(
    info: FunctionInfo<'a>,
    opts: &PluginOptions,
    context: &mut ProgramContext,
) -> Option<CompileSource<'a>> {
    // Skip if already compiled
    if let Some(start) = info.base.start {
        if context.is_already_compiled(start) {
            return None;
        }
    }

    let fn_type = get_react_function_type(
        info.name.as_deref(),
        info.params,
        &info.body,
        &info.body_directives,
        false,
        info.parent_callee_name.as_deref(),
        opts,
    )?;

    // Mark as compiled
    if let Some(start) = info.base.start {
        context.mark_compiled(start);
    }

    Some(CompileSource {
        kind: CompileSourceKind::Original,
        fn_node: info.fn_node,
        fn_name: info.name,
        fn_loc: base_node_loc(info.base),
        fn_ast_loc: info.base.loc.clone(),
        fn_start: info.base.start,
        fn_end: info.base.end,
        fn_type,
        body_directives: info.body_directives,
    })
}

/// Get the variable declarator name (for inferring function names from `const Foo = () => {}`)
fn get_declarator_name(decl: &VariableDeclarator) -> Option<String> {
    match &decl.id {
        PatternLike::Identifier(id) => Some(id.name.clone()),
        _ => None,
    }
}

/// Check if an expression is a function wrapped in forwardRef/memo, and if so
/// extract the inner function info with the callee name for context.
fn try_extract_wrapped_function<'a>(
    expr: &'a Expression,
    inferred_name: Option<String>,
) -> Option<FunctionInfo<'a>> {
    if let Expression::CallExpression(call) = expr {
        let callee_name = get_callee_name_if_react_api(&call.callee)?;
        // The first argument should be a function
        if let Some(first_arg) = call.arguments.first() {
            return match first_arg {
                Expression::FunctionExpression(func) => Some(fn_info_from_func_expr(
                    func,
                    inferred_name,
                    Some(callee_name.to_string()),
                )),
                Expression::ArrowFunctionExpression(arrow) => Some(fn_info_from_arrow(
                    arrow,
                    inferred_name,
                    Some(callee_name.to_string()),
                )),
                _ => None,
            };
        }
    }
    None
}

/// Find all functions in the program that should be compiled.
///
/// Traverses the top-level program body looking for:
/// - FunctionDeclaration
/// - VariableDeclaration with function expression initializers
/// - ExportDefaultDeclaration with function declarations/expressions
/// - ExportNamedDeclaration with function declarations
///
/// Skips classes and their contents (they may reference `this`).
fn find_functions_to_compile<'a>(
    program: &'a Program,
    opts: &PluginOptions,
    context: &mut ProgramContext,
) -> Vec<CompileSource<'a>> {
    let mut queue = Vec::new();

    for (_index, stmt) in program.body.iter().enumerate() {
        match stmt {
            // Skip classes
            Statement::ClassDeclaration(_) => continue,

            Statement::FunctionDeclaration(func) => {
                let info = fn_info_from_decl(func);
                if let Some(source) = try_make_compile_source(info, opts, context) {
                    queue.push(source);
                }
            }

            Statement::VariableDeclaration(var_decl) => {
                for decl in &var_decl.declarations {
                    if let Some(ref init) = decl.init {
                        let inferred_name = get_declarator_name(decl);

                        match init.as_ref() {
                            Expression::FunctionExpression(func) => {
                                let info = fn_info_from_func_expr(func, inferred_name, None);
                                if let Some(source) = try_make_compile_source(info, opts, context) {
                                    queue.push(source);
                                }
                            }
                            Expression::ArrowFunctionExpression(arrow) => {
                                let info = fn_info_from_arrow(arrow, inferred_name, None);
                                if let Some(source) = try_make_compile_source(info, opts, context) {
                                    queue.push(source);
                                }
                            }
                            // Check for forwardRef/memo wrappers:
                            // const Foo = React.forwardRef(() => { ... })
                            // const Foo = memo(() => { ... })
                            other => {
                                if let Some(info) =
                                    try_extract_wrapped_function(other, inferred_name)
                                {
                                    if let Some(source) =
                                        try_make_compile_source(info, opts, context)
                                    {
                                        queue.push(source);
                                    }
                                }
                                // In 'all' mode, also find nested function expressions
                                // (e.g., const _ = { useHook: () => {} })
                                if opts.compilation_mode == "all" {
                                    find_nested_functions_in_expr(other, opts, context, &mut queue);
                                }
                            }
                        }
                    }
                }
            }

            Statement::ExportDefaultDeclaration(export) => {
                match export.declaration.as_ref() {
                    ExportDefaultDecl::FunctionDeclaration(func) => {
                        let info = fn_info_from_decl(func);
                        if let Some(source) = try_make_compile_source(info, opts, context) {
                            queue.push(source);
                        }
                    }
                    ExportDefaultDecl::Expression(expr) => match expr.as_ref() {
                        Expression::FunctionExpression(func) => {
                            let info = fn_info_from_func_expr(func, None, None);
                            if let Some(source) = try_make_compile_source(info, opts, context) {
                                queue.push(source);
                            }
                        }
                        Expression::ArrowFunctionExpression(arrow) => {
                            let info = fn_info_from_arrow(arrow, None, None);
                            if let Some(source) = try_make_compile_source(info, opts, context) {
                                queue.push(source);
                            }
                        }
                        other => {
                            if let Some(info) = try_extract_wrapped_function(other, None) {
                                if let Some(source) = try_make_compile_source(info, opts, context) {
                                    queue.push(source);
                                }
                            }
                        }
                    },
                    ExportDefaultDecl::ClassDeclaration(_) => {
                        // Skip classes
                    }
                }
            }

            Statement::ExportNamedDeclaration(export) => {
                if let Some(ref declaration) = export.declaration {
                    match declaration.as_ref() {
                        Declaration::FunctionDeclaration(func) => {
                            let info = fn_info_from_decl(func);
                            if let Some(source) = try_make_compile_source(info, opts, context) {
                                queue.push(source);
                            }
                        }
                        Declaration::VariableDeclaration(var_decl) => {
                            for decl in &var_decl.declarations {
                                if let Some(ref init) = decl.init {
                                    let inferred_name = get_declarator_name(decl);

                                    match init.as_ref() {
                                        Expression::FunctionExpression(func) => {
                                            let info =
                                                fn_info_from_func_expr(func, inferred_name, None);
                                            if let Some(source) =
                                                try_make_compile_source(info, opts, context)
                                            {
                                                queue.push(source);
                                            }
                                        }
                                        Expression::ArrowFunctionExpression(arrow) => {
                                            let info =
                                                fn_info_from_arrow(arrow, inferred_name, None);
                                            if let Some(source) =
                                                try_make_compile_source(info, opts, context)
                                            {
                                                queue.push(source);
                                            }
                                        }
                                        other => {
                                            if let Some(info) =
                                                try_extract_wrapped_function(other, inferred_name)
                                            {
                                                if let Some(source) =
                                                    try_make_compile_source(info, opts, context)
                                                {
                                                    queue.push(source);
                                                }
                                            }
                                            // In 'all' mode, also find nested function expressions
                                            if opts.compilation_mode == "all" {
                                                find_nested_functions_in_expr(other, opts, context, &mut queue);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Declaration::ClassDeclaration(_) => {
                            // Skip classes
                        }
                        _ => {}
                    }
                }
            }

            // ExpressionStatement: check for bare forwardRef/memo calls
            // e.g. React.memo(props => { ... })
            Statement::ExpressionStatement(expr_stmt) => {
                if let Some(info) = try_extract_wrapped_function(&expr_stmt.expression, None) {
                    if let Some(source) = try_make_compile_source(info, opts, context) {
                        queue.push(source);
                    }
                }
                // In 'all' mode, also find function expressions/arrows nested
                // in top-level expression statements (e.g., `Foo = () => ...`,
                // `unknownFunction(function() { ... })`)
                if opts.compilation_mode == "all" {
                    find_nested_functions_in_expr(&expr_stmt.expression, opts, context, &mut queue);
                }
            }

            // All other statement types are ignored (imports, type declarations, etc.)
            _ => {}
        }
    }

    queue
}

/// Recursively find function expressions and arrow functions nested within
/// an expression.  This is used in `compilationMode: 'all'` to match the
/// TypeScript compiler's Babel traverse behavior, which visits every
/// FunctionExpression / ArrowFunctionExpression in the AST (but only
/// compiles those whose parent scope is the program scope).
fn find_nested_functions_in_expr<'a>(
    expr: &'a Expression,
    opts: &PluginOptions,
    context: &mut ProgramContext,
    queue: &mut Vec<CompileSource<'a>>,
) {
    match expr {
        Expression::FunctionExpression(func) => {
            let info = fn_info_from_func_expr(func, None, None);
            if let Some(source) = try_make_compile_source(info, opts, context) {
                queue.push(source);
            }
            // Don't recurse into the function body (nested functions are not
            // at program scope level)
        }
        Expression::ArrowFunctionExpression(arrow) => {
            let info = fn_info_from_arrow(arrow, None, None);
            if let Some(source) = try_make_compile_source(info, opts, context) {
                queue.push(source);
            }
            // Don't recurse into the function body
        }
        // Skip class expressions (they may reference `this`)
        Expression::ClassExpression(_) => {}
        // Recurse into sub-expressions
        Expression::AssignmentExpression(assign) => {
            find_nested_functions_in_expr(&assign.right, opts, context, queue);
        }
        Expression::CallExpression(call) => {
            for arg in &call.arguments {
                find_nested_functions_in_expr(arg, opts, context, queue);
            }
        }
        Expression::SequenceExpression(seq) => {
            for expr in &seq.expressions {
                find_nested_functions_in_expr(expr, opts, context, queue);
            }
        }
        Expression::ConditionalExpression(cond) => {
            find_nested_functions_in_expr(&cond.consequent, opts, context, queue);
            find_nested_functions_in_expr(&cond.alternate, opts, context, queue);
        }
        Expression::LogicalExpression(logical) => {
            find_nested_functions_in_expr(&logical.left, opts, context, queue);
            find_nested_functions_in_expr(&logical.right, opts, context, queue);
        }
        Expression::BinaryExpression(binary) => {
            find_nested_functions_in_expr(&binary.left, opts, context, queue);
            find_nested_functions_in_expr(&binary.right, opts, context, queue);
        }
        Expression::UnaryExpression(unary) => {
            find_nested_functions_in_expr(&unary.argument, opts, context, queue);
        }
        Expression::ArrayExpression(arr) => {
            for elem in &arr.elements {
                if let Some(e) = elem {
                    find_nested_functions_in_expr(e, opts, context, queue);
                }
            }
        }
        Expression::ObjectExpression(obj) => {
            for prop in &obj.properties {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(p) => {
                        find_nested_functions_in_expr(&p.value, opts, context, queue);
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        find_nested_functions_in_expr(&s.argument, opts, context, queue);
                    }
                    ObjectExpressionProperty::ObjectMethod(_) => {}
                }
            }
        }
        Expression::NewExpression(new) => {
            for arg in &new.arguments {
                find_nested_functions_in_expr(arg, opts, context, queue);
            }
        }
        Expression::ParenthesizedExpression(paren) => {
            find_nested_functions_in_expr(&paren.expression, opts, context, queue);
        }
        Expression::OptionalCallExpression(call) => {
            for arg in &call.arguments {
                find_nested_functions_in_expr(arg, opts, context, queue);
            }
        }
        Expression::TSAsExpression(ts) => {
            find_nested_functions_in_expr(&ts.expression, opts, context, queue);
        }
        Expression::TSSatisfiesExpression(ts) => {
            find_nested_functions_in_expr(&ts.expression, opts, context, queue);
        }
        Expression::TSNonNullExpression(ts) => {
            find_nested_functions_in_expr(&ts.expression, opts, context, queue);
        }
        Expression::TSTypeAssertion(ts) => {
            find_nested_functions_in_expr(&ts.expression, opts, context, queue);
        }
        Expression::TypeCastExpression(tc) => {
            find_nested_functions_in_expr(&tc.expression, opts, context, queue);
        }
        // Leaf expressions or expressions that don't contain functions
        _ => {}
    }
}

// -----------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------

/// A successfully compiled function, ready to be applied to the AST.
struct CompiledFunction<'a> {
    #[allow(dead_code)]
    kind: CompileSourceKind,
    #[allow(dead_code)]
    source: &'a CompileSource<'a>,
    codegen_fn: CodegenFunction,
}

/// The type of the original function node, used to determine what kind of
/// replacement node to create.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OriginalFnKind {
    FunctionDeclaration,
    FunctionExpression,
    ArrowFunctionExpression,
}

/// Owned representation of a compiled function for AST replacement.
/// Does not borrow from the original program, so we can mutate the AST.
struct CompiledFnForReplacement {
    /// Start position of the original function, used to find it in the AST.
    fn_start: Option<u32>,
    /// The kind of the original function node.
    original_kind: OriginalFnKind,
    /// The compiled codegen output.
    codegen_fn: CodegenFunction,
    /// Whether this is an original function (vs outlined). Gating only applies to original.
    #[allow(dead_code)]
    source_kind: CompileSourceKind,
    /// The function name, if any.
    fn_name: Option<String>,
    /// Gating configuration (from dynamic gating or plugin options).
    gating: Option<GatingConfig>,
}

/// Check if a compiled function is referenced before its declaration at the top level.
/// This is needed for the gating rewrite: hoisted function declarations that are
/// referenced before their declaration site need a special gating pattern.
fn get_functions_referenced_before_declaration(
    program: &Program,
    compiled_fns: &[CompiledFnForReplacement],
) -> HashSet<u32> {
    // Collect function names and their start positions for compiled FunctionDeclarations
    let mut fn_names: HashMap<String, u32> = HashMap::new();
    for compiled in compiled_fns {
        if compiled.original_kind == OriginalFnKind::FunctionDeclaration {
            if let Some(ref name) = compiled.fn_name {
                if let Some(start) = compiled.fn_start {
                    fn_names.insert(name.clone(), start);
                }
            }
        }
    }

    if fn_names.is_empty() {
        return HashSet::new();
    }

    let mut referenced_before_decl: HashSet<u32> = HashSet::new();

    // Walk through program body in order. For each statement, check if it references
    // any of the function names before the function's declaration.
    for stmt in &program.body {
        // Check if this statement IS one of the function declarations
        if let Statement::FunctionDeclaration(f) = stmt {
            if let Some(ref id) = f.id {
                fn_names.remove(&id.name);
            }
        }
        // For all remaining tracked names, check if the statement references them
        // at the top level (not inside nested functions)
        for (name, start) in &fn_names {
            if stmt_references_identifier_at_top_level(stmt, name) {
                referenced_before_decl.insert(*start);
            }
        }
    }

    referenced_before_decl
}

/// Check if a statement references an identifier at the top level (not inside nested functions).
fn stmt_references_identifier_at_top_level(stmt: &Statement, name: &str) -> bool {
    match stmt {
        Statement::FunctionDeclaration(_) => {
            // Don't look inside function declarations (they create their own scope)
            false
        }
        Statement::ExportDefaultDeclaration(export) => match export.declaration.as_ref() {
            ExportDefaultDecl::Expression(e) => expr_references_identifier_at_top_level(e, name),
            _ => false,
        },
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref decl) = export.declaration {
                match decl.as_ref() {
                    Declaration::VariableDeclaration(var_decl) => {
                        var_decl.declarations.iter().any(|d| {
                            d.init
                                .as_ref()
                                .map_or(false, |e| expr_references_identifier_at_top_level(e, name))
                        })
                    }
                    _ => false,
                }
            } else {
                // export { Name } - check specifiers
                export.specifiers.iter().any(|s| {
                    if let react_compiler_ast::declarations::ExportSpecifier::ExportSpecifier(spec) = s {
                        match &spec.local {
                            ModuleExportName::Identifier(id) => id.name == name,
                            _ => false,
                        }
                    } else {
                        false
                    }
                })
            }
        }
        Statement::VariableDeclaration(var_decl) => var_decl.declarations.iter().any(|d| {
            d.init
                .as_ref()
                .map_or(false, |e| expr_references_identifier_at_top_level(e, name))
        }),
        Statement::ExpressionStatement(expr_stmt) => {
            expr_references_identifier_at_top_level(&expr_stmt.expression, name)
        }
        Statement::ReturnStatement(ret) => ret
            .argument
            .as_ref()
            .map_or(false, |e| expr_references_identifier_at_top_level(e, name)),
        _ => false,
    }
}

/// Check if an expression references an identifier at the top level.
fn expr_references_identifier_at_top_level(expr: &Expression, name: &str) -> bool {
    match expr {
        Expression::Identifier(id) => id.name == name,
        Expression::CallExpression(call) => {
            expr_references_identifier_at_top_level(&call.callee, name)
                || call
                    .arguments
                    .iter()
                    .any(|a| expr_references_identifier_at_top_level(a, name))
        }
        Expression::MemberExpression(member) => {
            expr_references_identifier_at_top_level(&member.object, name)
        }
        Expression::ConditionalExpression(cond) => {
            expr_references_identifier_at_top_level(&cond.test, name)
                || expr_references_identifier_at_top_level(&cond.consequent, name)
                || expr_references_identifier_at_top_level(&cond.alternate, name)
        }
        Expression::BinaryExpression(bin) => {
            expr_references_identifier_at_top_level(&bin.left, name)
                || expr_references_identifier_at_top_level(&bin.right, name)
        }
        Expression::LogicalExpression(log) => {
            expr_references_identifier_at_top_level(&log.left, name)
                || expr_references_identifier_at_top_level(&log.right, name)
        }
        // Don't recurse into function expressions/arrows (they create their own scope)
        Expression::FunctionExpression(_) | Expression::ArrowFunctionExpression(_) => false,
        _ => false,
    }
}

/// Build a function expression from a codegen function (compiled output).
fn build_compiled_function_expression(codegen: &CodegenFunction) -> Expression {
    Expression::FunctionExpression(FunctionExpression {
        base: BaseNode::typed("FunctionExpression"),
        id: codegen.id.clone(),
        params: codegen.params.clone(),
        body: codegen.body.clone(),
        generator: codegen.generator,
        is_async: codegen.is_async,
        return_type: None,
        type_parameters: None,
    })
}

/// Build a function expression that preserves the original function's structure.
/// For FunctionDeclarations, converts to FunctionExpression.
/// For ArrowFunctionExpressions, keeps as-is.
fn clone_original_fn_as_expression(stmt: &Statement, start: u32) -> Option<Expression> {
    match stmt {
        Statement::FunctionDeclaration(f) => {
            if f.base.start == Some(start) {
                return Some(Expression::FunctionExpression(FunctionExpression {
                    base: BaseNode::typed("FunctionExpression"),
                    id: f.id.clone(),
                    params: f.params.clone(),
                    body: f.body.clone(),
                    generator: f.generator,
                    is_async: f.is_async,
                    return_type: None,
                    type_parameters: None,
                }));
            }
            None
        }
        Statement::VariableDeclaration(var_decl) => {
            for d in &var_decl.declarations {
                if let Some(ref init) = d.init {
                    if let Some(e) = clone_original_expr_as_expression(init, start) {
                        return Some(e);
                    }
                }
            }
            None
        }
        Statement::ExportDefaultDeclaration(export) => match export.declaration.as_ref() {
            ExportDefaultDecl::FunctionDeclaration(f) => {
                if f.base.start == Some(start) {
                    return Some(Expression::FunctionExpression(FunctionExpression {
                        base: BaseNode::typed("FunctionExpression"),
                        id: f.id.clone(),
                        params: f.params.clone(),
                        body: f.body.clone(),
                        generator: f.generator,
                        is_async: f.is_async,
                        return_type: None,
                        type_parameters: None,
                    }));
                }
                None
            }
            ExportDefaultDecl::Expression(e) => clone_original_expr_as_expression(e, start),
            _ => None,
        },
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref decl) = export.declaration {
                match decl.as_ref() {
                    Declaration::FunctionDeclaration(f) => {
                        if f.base.start == Some(start) {
                            return Some(Expression::FunctionExpression(FunctionExpression {
                                base: BaseNode::typed("FunctionExpression"),
                                id: f.id.clone(),
                                params: f.params.clone(),
                                body: f.body.clone(),
                                generator: f.generator,
                                is_async: f.is_async,
                                return_type: None,
                                type_parameters: None,
                            }));
                        }
                        None
                    }
                    Declaration::VariableDeclaration(var_decl) => {
                        for d in &var_decl.declarations {
                            if let Some(ref init) = d.init {
                                if let Some(e) = clone_original_expr_as_expression(init, start) {
                                    return Some(e);
                                }
                            }
                        }
                        None
                    }
                    _ => None,
                }
            } else {
                None
            }
        }
        Statement::ExpressionStatement(expr_stmt) => {
            clone_original_expr_as_expression(&expr_stmt.expression, start)
        }
        _ => None,
    }
}

/// Clone an expression node for use as the original (fallback) in gating.
fn clone_original_expr_as_expression(expr: &Expression, start: u32) -> Option<Expression> {
    match expr {
        Expression::FunctionExpression(f) => {
            if f.base.start == Some(start) {
                return Some(Expression::FunctionExpression(f.clone()));
            }
            None
        }
        Expression::ArrowFunctionExpression(f) => {
            if f.base.start == Some(start) {
                return Some(Expression::ArrowFunctionExpression(f.clone()));
            }
            None
        }
        Expression::CallExpression(call) => {
            for arg in &call.arguments {
                if let Some(e) = clone_original_expr_as_expression(arg, start) {
                    return Some(e);
                }
            }
            None
        }
        Expression::ObjectExpression(obj) => {
            for prop in &obj.properties {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(p) => {
                        if let Some(e) = clone_original_expr_as_expression(&p.value, start) {
                            return Some(e);
                        }
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        if let Some(e) = clone_original_expr_as_expression(&s.argument, start) {
                            return Some(e);
                        }
                    }
                    _ => {}
                }
            }
            None
        }
        Expression::ArrayExpression(arr) => {
            for elem in arr.elements.iter().flatten() {
                if let Some(e) = clone_original_expr_as_expression(elem, start) {
                    return Some(e);
                }
            }
            None
        }
        Expression::AssignmentExpression(assign) => {
            clone_original_expr_as_expression(&assign.right, start)
        }
        Expression::SequenceExpression(seq) => {
            for e in &seq.expressions {
                if let Some(e) = clone_original_expr_as_expression(e, start) {
                    return Some(e);
                }
            }
            None
        }
        Expression::ConditionalExpression(cond) => {
            if let Some(e) = clone_original_expr_as_expression(&cond.consequent, start) {
                return Some(e);
            }
            clone_original_expr_as_expression(&cond.alternate, start)
        }
        Expression::ParenthesizedExpression(paren) => {
            clone_original_expr_as_expression(&paren.expression, start)
        }
        _ => None,
    }
}

/// Build a compiled arrow/function expression from a codegen function,
/// matching the original expression kind.
fn build_compiled_expression_matching_kind(
    codegen: &CodegenFunction,
    original_kind: OriginalFnKind,
) -> Expression {
    match original_kind {
        OriginalFnKind::ArrowFunctionExpression => {
            Expression::ArrowFunctionExpression(ArrowFunctionExpression {
                base: BaseNode::typed("ArrowFunctionExpression"),
                params: codegen.params.clone(),
                body: Box::new(ArrowFunctionBody::BlockStatement(codegen.body.clone())),
                id: None,
                generator: codegen.generator,
                is_async: codegen.is_async,
                expression: Some(false),
                return_type: None,
                type_parameters: None,
                predicate: None,
            })
        }
        _ => build_compiled_function_expression(codegen),
    }
}

/// Apply compiled functions back to the AST by replacing original function nodes
/// with their compiled versions, inserting outlined functions, and adding imports.
fn apply_compiled_functions(
    compiled_fns: &[CompiledFnForReplacement],
    program: &mut Program,
    context: &mut ProgramContext,
) {
    if compiled_fns.is_empty() {
        return;
    }

    // Check if any compiled functions have gating enabled
    let has_gating = compiled_fns.iter().any(|cf| cf.gating.is_some());

    // If gating is enabled, determine which functions are referenced before declaration
    let referenced_before_decl = if has_gating {
        get_functions_referenced_before_declaration(program, compiled_fns)
    } else {
        HashSet::new()
    };

    // For gated functions, we need to clone the original function expressions
    // BEFORE we start mutating the AST.
    let original_expressions: Vec<Option<Expression>> = if has_gating {
        compiled_fns
            .iter()
            .map(|compiled| {
                if compiled.gating.is_some() {
                    if let Some(start) = compiled.fn_start {
                        for stmt in program.body.iter() {
                            if let Some(expr) = clone_original_fn_as_expression(stmt, start) {
                                return Some(expr);
                            }
                        }
                    }
                    None
                } else {
                    None
                }
            })
            .collect()
    } else {
        compiled_fns.iter().map(|_| None).collect()
    };

    // Collect outlined functions to insert (as FunctionDeclarations).
    // For FunctionDeclarations: insert right after the parent (matching TS insertAfter behavior)
    // For FunctionExpression/ArrowFunctionExpression: append at end of program body
    //   (matching TS pushContainer behavior)
    let mut outlined_decls: Vec<(Option<u32>, OriginalFnKind, FunctionDeclaration)> = Vec::new();

    // Replace each compiled function in the AST
    for (idx, compiled) in compiled_fns.iter().enumerate() {
        // Collect outlined functions for this compiled function
        for outlined in &compiled.codegen_fn.outlined {
            let outlined_decl = FunctionDeclaration {
                base: BaseNode::typed("FunctionDeclaration"),
                id: outlined.func.id.clone(),
                params: outlined.func.params.clone(),
                body: outlined.func.body.clone(),
                generator: outlined.func.generator,
                is_async: outlined.func.is_async,
                declare: None,
                return_type: None,
                type_parameters: None,
                predicate: None,
            };
            outlined_decls.push((compiled.fn_start, compiled.original_kind, outlined_decl));
        }

        if let Some(ref gating_config) = compiled.gating {
            let is_ref_before_decl = compiled
                .fn_start
                .map_or(false, |s| referenced_before_decl.contains(&s));

            if is_ref_before_decl && compiled.original_kind == OriginalFnKind::FunctionDeclaration {
                // Use the hoisted function declaration gating pattern
                apply_gated_function_hoisted(
                    program,
                    compiled,
                    gating_config,
                    context,
                );
            } else {
                // Use the conditional expression gating pattern
                let original_expr = original_expressions[idx].clone();
                apply_gated_function_conditional(
                    program,
                    compiled,
                    gating_config,
                    original_expr,
                    context,
                );
            }
        } else {
            // No gating: replace the function directly (original behavior)
            replace_function_in_program(program, compiled);
        }
    }

    // Insert outlined function declarations.
    let mut insert_decls: Vec<(Option<u32>, FunctionDeclaration)> = Vec::new();
    let mut push_decls: Vec<FunctionDeclaration> = Vec::new();

    for (parent_start, original_kind, outlined_decl) in outlined_decls {
        match original_kind {
            OriginalFnKind::FunctionDeclaration => {
                insert_decls.push((parent_start, outlined_decl));
            }
            OriginalFnKind::FunctionExpression | OriginalFnKind::ArrowFunctionExpression => {
                push_decls.push(outlined_decl);
            }
        }
    }

    for (parent_start, outlined_decl) in insert_decls.into_iter() {
        let insert_idx = if let Some(start) = parent_start {
            program
                .body
                .iter()
                .position(|stmt| stmt_has_fn_at_start(stmt, start))
                .map(|pos| pos + 1)
                .unwrap_or(program.body.len())
        } else {
            program.body.len()
        };
        program
            .body
            .insert(insert_idx, Statement::FunctionDeclaration(outlined_decl));
    }

    for outlined_decl in push_decls {
        program
            .body
            .push(Statement::FunctionDeclaration(outlined_decl));
    }

    // Register the memo cache import and rename useMemoCache references.
    let needs_memo_import = compiled_fns
        .iter()
        .any(|cf| cf.codegen_fn.memo_slots_used > 0);
    if needs_memo_import {
        let import_spec = context.add_memo_cache_import();
        let local_name = import_spec.name;
        for stmt in program.body.iter_mut() {
            rename_identifier_in_statement(stmt, "useMemoCache", &local_name);
        }
    }

    // Instrumentation and hook guard imports are pre-registered in compile_program
    // before compilation, so they are already in the imports map. No post-hoc
    // renaming needed since codegen uses the pre-resolved local names.

    add_imports_to_program(program, context);
}

/// Apply the conditional expression gating pattern.
///
/// For function declarations (non-export-default, non-hoisted):
///   `function Foo(props) { ... }` -> `const Foo = gating() ? function Foo(...) { compiled } : function Foo(...) { original };`
///
/// For export default function with name:
///   `export default function Foo(props) { ... }` -> `const Foo = gating() ? ... : ...; export default Foo;`
///
/// For export named function:
///   `export function Foo(props) { ... }` -> `export const Foo = gating() ? ... : ...;`
///
/// For arrow/function expressions:
///   Replace the expression inline with `gating() ? compiled : original`
fn apply_gated_function_conditional(
    program: &mut Program,
    compiled: &CompiledFnForReplacement,
    gating_config: &GatingConfig,
    original_expr: Option<Expression>,
    context: &mut ProgramContext,
) {
    let start = match compiled.fn_start {
        Some(s) => s,
        None => return,
    };

    // Add the gating import
    let gating_import = context.add_import_specifier(
        &gating_config.source,
        &gating_config.import_specifier_name,
        None,
    );
    let gating_callee_name = gating_import.name;

    // Build the compiled expression
    let compiled_expr =
        build_compiled_expression_matching_kind(&compiled.codegen_fn, compiled.original_kind);

    // Build the original (fallback) expression
    let original_expr = match original_expr {
        Some(e) => e,
        None => return, // shouldn't happen
    };

    // Build: gating() ? compiled : original
    let gating_expression = Expression::ConditionalExpression(ConditionalExpression {
        base: BaseNode::typed("ConditionalExpression"),
        test: Box::new(Expression::CallExpression(CallExpression {
            base: BaseNode::typed("CallExpression"),
            callee: Box::new(Expression::Identifier(Identifier {
                base: BaseNode::typed("Identifier"),
                name: gating_callee_name,
                type_annotation: None,
                optional: None,
                decorators: None,
            })),
            arguments: vec![],
            type_parameters: None,
            type_arguments: None,
            optional: None,
        })),
        consequent: Box::new(compiled_expr),
        alternate: Box::new(original_expr),
    });

    // Find and replace the function in the program body.
    // We need to track if this was an export default function with a name,
    // because we need to insert `export default Name;` after the replacement.
    let mut export_default_name: Option<(usize, String)> = None;

    for (idx, stmt) in program.body.iter_mut().enumerate() {
        // Check for export default function with a name (needs special handling)
        if let Statement::ExportDefaultDeclaration(export) = stmt {
            if let ExportDefaultDecl::FunctionDeclaration(f) = export.declaration.as_ref() {
                if f.base.start == Some(start) {
                    if let Some(ref fn_id) = f.id {
                        export_default_name = Some((idx, fn_id.name.clone()));
                    }
                }
            }
        }
        if replace_fn_with_gated(stmt, start, compiled, &gating_expression) {
            break;
        }
    }

    // If this was an export default function with a name, insert `export default Name;` after
    if let Some((idx, name)) = export_default_name {
        program.body.insert(
            idx + 1,
            Statement::ExportDefaultDeclaration(ExportDefaultDeclaration {
                base: BaseNode::typed("ExportDefaultDeclaration"),
                declaration: Box::new(ExportDefaultDecl::Expression(Box::new(
                    Expression::Identifier(Identifier {
                        base: BaseNode::typed("Identifier"),
                        name,
                        type_annotation: None,
                        optional: None,
                        decorators: None,
                    }),
                ))),
                export_kind: None,
            }),
        );
    }
}

/// Replace a function in a statement with a gated version (conditional expression).
/// Returns true if the replacement was made.
fn replace_fn_with_gated(
    stmt: &mut Statement,
    start: u32,
    _compiled: &CompiledFnForReplacement,
    gating_expression: &Expression,
) -> bool {
    match stmt {
        Statement::FunctionDeclaration(f) => {
            if f.base.start == Some(start) {
                // Convert: `function Foo(props) { ... }`
                // To: `const Foo = gating() ? ... : ...;`
                let fn_name = f.id.clone().unwrap_or_else(|| Identifier {
                    base: BaseNode::typed("Identifier"),
                    name: "anonymous".to_string(),
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                });
                // Transfer comments from original function to the replacement
                let mut base = BaseNode::typed("VariableDeclaration");
                base.leading_comments = f.base.leading_comments.clone();
                base.trailing_comments = f.base.trailing_comments.clone();
                base.inner_comments = f.base.inner_comments.clone();
                *stmt = Statement::VariableDeclaration(VariableDeclaration {
                    base,
                    kind: VariableDeclarationKind::Const,
                    declarations: vec![VariableDeclarator {
                        base: BaseNode::typed("VariableDeclarator"),
                        id: PatternLike::Identifier(fn_name),
                        init: Some(Box::new(gating_expression.clone())),
                        definite: None,
                    }],
                    declare: None,
                });
                return true;
            }
        }
        Statement::ExportDefaultDeclaration(export) => {
            // Check if this is a FunctionDeclaration first
            let is_fn_decl_match = matches!(
                export.declaration.as_ref(),
                ExportDefaultDecl::FunctionDeclaration(f) if f.base.start == Some(start)
            );
            if is_fn_decl_match {
                if let ExportDefaultDecl::FunctionDeclaration(f) = export.declaration.as_ref() {
                    let fn_name = f.id.clone();
                    if let Some(fn_id) = fn_name {
                        // `export default function Foo(props) { ... }`
                        // -> `const Foo = gating() ? ... : ...; export default Foo;`
                        // Transfer comments from the export statement
                        let mut base = BaseNode::typed("VariableDeclaration");
                        base.leading_comments = export.base.leading_comments.clone();
                        base.trailing_comments = export.base.trailing_comments.clone();
                        base.inner_comments = export.base.inner_comments.clone();
                        let var_stmt = Statement::VariableDeclaration(VariableDeclaration {
                            base,
                            kind: VariableDeclarationKind::Const,
                            declarations: vec![VariableDeclarator {
                                base: BaseNode::typed("VariableDeclarator"),
                                id: PatternLike::Identifier(fn_id.clone()),
                                init: Some(Box::new(gating_expression.clone())),
                                definite: None,
                            }],
                            declare: None,
                        });
                        *stmt = var_stmt;
                        return true;
                    } else {
                        // `export default function(props) { ... }` (anonymous)
                        // -> `export default gating() ? ... : ...`
                        export.declaration =
                            Box::new(ExportDefaultDecl::Expression(Box::new(gating_expression.clone())));
                        return true;
                    }
                }
            }
            // Check Expression case
            if let ExportDefaultDecl::Expression(e) = export.declaration.as_mut() {
                if replace_gated_in_expression(e, start, gating_expression) {
                    return true;
                }
            }
        }
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref mut decl) = export.declaration {
                match decl.as_mut() {
                    Declaration::FunctionDeclaration(f) => {
                        if f.base.start == Some(start) {
                            // `export function Foo(props) { ... }`
                            // -> `export const Foo = gating() ? ... : ...;`
                            let fn_name = f.id.clone().unwrap_or_else(|| Identifier {
                                base: BaseNode::typed("Identifier"),
                                name: "anonymous".to_string(),
                                type_annotation: None,
                                optional: None,
                                decorators: None,
                            });
                            *decl = Box::new(Declaration::VariableDeclaration(
                                VariableDeclaration {
                                    base: BaseNode::typed("VariableDeclaration"),
                                    kind: VariableDeclarationKind::Const,
                                    declarations: vec![VariableDeclarator {
                                        base: BaseNode::typed("VariableDeclarator"),
                                        id: PatternLike::Identifier(fn_name),
                                        init: Some(Box::new(gating_expression.clone())),
                                        definite: None,
                                    }],
                                    declare: None,
                                },
                            ));
                            return true;
                        }
                    }
                    Declaration::VariableDeclaration(var_decl) => {
                        for d in var_decl.declarations.iter_mut() {
                            if let Some(ref mut init) = d.init {
                                if replace_gated_in_expression(init, start, gating_expression) {
                                    return true;
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Statement::VariableDeclaration(var_decl) => {
            for d in var_decl.declarations.iter_mut() {
                if let Some(ref mut init) = d.init {
                    if replace_gated_in_expression(init, start, gating_expression) {
                        return true;
                    }
                }
            }
        }
        Statement::ExpressionStatement(expr_stmt) => {
            if replace_gated_in_expression(&mut expr_stmt.expression, start, gating_expression) {
                return true;
            }
        }
        _ => {}
    }
    false
}

/// Replace a function in an expression with a gated conditional expression.
fn replace_gated_in_expression(
    expr: &mut Expression,
    start: u32,
    gating_expression: &Expression,
) -> bool {
    match expr {
        Expression::FunctionExpression(f) => {
            if f.base.start == Some(start) {
                *expr = gating_expression.clone();
                return true;
            }
        }
        Expression::ArrowFunctionExpression(f) => {
            if f.base.start == Some(start) {
                *expr = gating_expression.clone();
                return true;
            }
        }
        Expression::CallExpression(call) => {
            for arg in call.arguments.iter_mut() {
                if replace_gated_in_expression(arg, start, gating_expression) {
                    return true;
                }
            }
        }
        Expression::ObjectExpression(obj) => {
            for prop in obj.properties.iter_mut() {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(p) => {
                        if replace_gated_in_expression(&mut p.value, start, gating_expression) {
                            return true;
                        }
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        if replace_gated_in_expression(&mut s.argument, start, gating_expression) {
                            return true;
                        }
                    }
                    _ => {}
                }
            }
        }
        Expression::ArrayExpression(arr) => {
            for elem in arr.elements.iter_mut().flatten() {
                if replace_gated_in_expression(elem, start, gating_expression) {
                    return true;
                }
            }
        }
        Expression::AssignmentExpression(assign) => {
            if replace_gated_in_expression(&mut assign.right, start, gating_expression) {
                return true;
            }
        }
        Expression::SequenceExpression(seq) => {
            for e in seq.expressions.iter_mut() {
                if replace_gated_in_expression(e, start, gating_expression) {
                    return true;
                }
            }
        }
        Expression::ConditionalExpression(cond) => {
            if replace_gated_in_expression(&mut cond.consequent, start, gating_expression) {
                return true;
            }
            if replace_gated_in_expression(&mut cond.alternate, start, gating_expression) {
                return true;
            }
        }
        Expression::ParenthesizedExpression(paren) => {
            if replace_gated_in_expression(&mut paren.expression, start, gating_expression) {
                return true;
            }
        }
        Expression::NewExpression(new) => {
            for arg in new.arguments.iter_mut() {
                if replace_gated_in_expression(arg, start, gating_expression) {
                    return true;
                }
            }
        }
        _ => {}
    }
    false
}

/// Apply the hoisted function declaration gating pattern.
///
/// This is used when a function declaration is referenced before its declaration site.
/// Instead of wrapping in a conditional expression (which would break hoisting), we:
/// 1. Rename the original function to `Foo_unoptimized`
/// 2. Insert a compiled function as `Foo_optimized`
/// 3. Insert a `const gating_result = gating()` before
/// 4. Insert a new `function Foo(arg0, ...) { if (gating_result) return Foo_optimized(...); else return Foo_unoptimized(...); }` after
fn apply_gated_function_hoisted(
    program: &mut Program,
    compiled: &CompiledFnForReplacement,
    gating_config: &GatingConfig,
    context: &mut ProgramContext,
) {
    let start = match compiled.fn_start {
        Some(s) => s,
        None => return,
    };

    let original_fn_name = match &compiled.fn_name {
        Some(name) => name.clone(),
        None => return,
    };

    // Add the gating import
    let gating_import = context.add_import_specifier(
        &gating_config.source,
        &gating_config.import_specifier_name,
        None,
    );
    let gating_callee_name = gating_import.name.clone();

    // Generate unique names
    let gating_result_name = context.new_uid(&format!("{}_result", gating_callee_name));
    let unoptimized_name = context.new_uid(&format!("{}_unoptimized", original_fn_name));
    let optimized_name = context.new_uid(&format!("{}_optimized", original_fn_name));

    // Find the original function declaration and determine its params
    let mut original_params: Vec<PatternLike> = Vec::new();
    let mut fn_stmt_idx: Option<usize> = None;

    for (idx, stmt) in program.body.iter().enumerate() {
        if let Statement::FunctionDeclaration(f) = stmt {
            if f.base.start == Some(start) {
                original_params = f.params.clone();
                fn_stmt_idx = Some(idx);
                break;
            }
        }
    }

    let fn_idx = match fn_stmt_idx {
        Some(idx) => idx,
        None => return,
    };

    // Rename the original function to `_unoptimized`
    if let Statement::FunctionDeclaration(f) = &mut program.body[fn_idx] {
        if let Some(ref mut id) = f.id {
            id.name = unoptimized_name.clone();
        }
    }

    // Build the optimized function declaration (compiled version with renamed id)
    let compiled_fn_decl = FunctionDeclaration {
        base: BaseNode::typed("FunctionDeclaration"),
        id: Some(Identifier {
            base: BaseNode::typed("Identifier"),
            name: optimized_name.clone(),
            type_annotation: None,
            optional: None,
            decorators: None,
        }),
        params: compiled.codegen_fn.params.clone(),
        body: compiled.codegen_fn.body.clone(),
        generator: compiled.codegen_fn.generator,
        is_async: compiled.codegen_fn.is_async,
        declare: None,
        return_type: None,
        type_parameters: None,
        predicate: None,
    };

    // Build the gating result variable: `const gating_result = gating();`
    let gating_result_stmt = Statement::VariableDeclaration(VariableDeclaration {
        base: BaseNode::typed("VariableDeclaration"),
        kind: VariableDeclarationKind::Const,
        declarations: vec![VariableDeclarator {
            base: BaseNode::typed("VariableDeclarator"),
            id: PatternLike::Identifier(Identifier {
                base: BaseNode::typed("Identifier"),
                name: gating_result_name.clone(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
            init: Some(Box::new(Expression::CallExpression(CallExpression {
                base: BaseNode::typed("CallExpression"),
                callee: Box::new(Expression::Identifier(Identifier {
                    base: BaseNode::typed("Identifier"),
                    name: gating_callee_name,
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })),
                arguments: vec![],
                type_parameters: None,
                type_arguments: None,
                optional: None,
            }))),
            definite: None,
        }],
        declare: None,
    });

    // Build new params and args for the dispatcher function
    let num_params = original_params.len();
    let mut new_params: Vec<PatternLike> = Vec::new();
    let mut optimized_args: Vec<Expression> = Vec::new();
    let mut unoptimized_args: Vec<Expression> = Vec::new();

    for i in 0..num_params {
        let arg_name = format!("arg{}", i);
        let is_rest = matches!(&original_params[i], PatternLike::RestElement(_));

        if is_rest {
            new_params.push(PatternLike::RestElement(
                react_compiler_ast::patterns::RestElement {
                    base: BaseNode::typed("RestElement"),
                    argument: Box::new(PatternLike::Identifier(Identifier {
                        base: BaseNode::typed("Identifier"),
                        name: arg_name.clone(),
                        type_annotation: None,
                        optional: None,
                        decorators: None,
                    })),
                    type_annotation: None,
                    decorators: None,
                },
            ));
            optimized_args.push(Expression::SpreadElement(SpreadElement {
                base: BaseNode::typed("SpreadElement"),
                argument: Box::new(Expression::Identifier(Identifier {
                    base: BaseNode::typed("Identifier"),
                    name: arg_name.clone(),
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })),
            }));
            unoptimized_args.push(Expression::SpreadElement(SpreadElement {
                base: BaseNode::typed("SpreadElement"),
                argument: Box::new(Expression::Identifier(Identifier {
                    base: BaseNode::typed("Identifier"),
                    name: arg_name,
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })),
            }));
        } else {
            new_params.push(PatternLike::Identifier(Identifier {
                base: BaseNode::typed("Identifier"),
                name: arg_name.clone(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }));
            optimized_args.push(Expression::Identifier(Identifier {
                base: BaseNode::typed("Identifier"),
                name: arg_name.clone(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }));
            unoptimized_args.push(Expression::Identifier(Identifier {
                base: BaseNode::typed("Identifier"),
                name: arg_name,
                type_annotation: None,
                optional: None,
                decorators: None,
            }));
        }
    }

    // Build the dispatcher function:
    // function Foo(arg0, ...) {
    //   if (gating_result) return Foo_optimized(arg0, ...);
    //   else return Foo_unoptimized(arg0, ...);
    // }
    let dispatcher_fn = Statement::FunctionDeclaration(FunctionDeclaration {
        base: BaseNode::typed("FunctionDeclaration"),
        id: Some(Identifier {
            base: BaseNode::typed("Identifier"),
            name: original_fn_name,
            type_annotation: None,
            optional: None,
            decorators: None,
        }),
        params: new_params,
        body: BlockStatement {
            base: BaseNode::typed("BlockStatement"),
            body: vec![Statement::IfStatement(IfStatement {
                base: BaseNode::typed("IfStatement"),
                test: Box::new(Expression::Identifier(Identifier {
                    base: BaseNode::typed("Identifier"),
                    name: gating_result_name,
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })),
                consequent: Box::new(Statement::ReturnStatement(ReturnStatement {
                    base: BaseNode::typed("ReturnStatement"),
                    argument: Some(Box::new(Expression::CallExpression(CallExpression {
                        base: BaseNode::typed("CallExpression"),
                        callee: Box::new(Expression::Identifier(Identifier {
                            base: BaseNode::typed("Identifier"),
                            name: optimized_name.clone(),
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        })),
                        arguments: optimized_args,
                        type_parameters: None,
                        type_arguments: None,
                        optional: None,
                    }))),
                })),
                alternate: Some(Box::new(Statement::ReturnStatement(ReturnStatement {
                    base: BaseNode::typed("ReturnStatement"),
                    argument: Some(Box::new(Expression::CallExpression(CallExpression {
                        base: BaseNode::typed("CallExpression"),
                        callee: Box::new(Expression::Identifier(Identifier {
                            base: BaseNode::typed("Identifier"),
                            name: unoptimized_name,
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        })),
                        arguments: unoptimized_args,
                        type_parameters: None,
                        type_arguments: None,
                        optional: None,
                    }))),
                }))),
            })],
            directives: vec![],
        },
        generator: false,
        is_async: false,
        declare: None,
        return_type: None,
        type_parameters: None,
        predicate: None,
    });

    // Insert nodes. The TS code uses insertBefore for the gating result and optimized fn,
    // and insertAfter for the dispatcher. The order in the output should be:
    //   ... (existing statements before fn_idx) ...
    //   const gating_result = gating();       <- inserted before
    //   function Foo_optimized() { ... }       <- inserted before
    //   function Foo_unoptimized() { ... }     <- the original (renamed)
    //   function Foo(arg0) { ... }             <- inserted after
    //   ... (existing statements after fn_idx) ...
    //
    // insertBefore inserts before the target, and insertAfter inserts after.
    // We insert in reverse order for insertAfter.

    // Insert dispatcher after the original (now renamed) function
    program
        .body
        .insert(fn_idx + 1, dispatcher_fn);

    // Insert optimized function before the original
    program.body.insert(
        fn_idx,
        Statement::FunctionDeclaration(compiled_fn_decl),
    );

    // Insert gating result before the optimized function
    program.body.insert(fn_idx, gating_result_stmt);
}

/// Rename an identifier in a statement (recursive walk).
fn rename_identifier_in_statement(stmt: &mut Statement, old_name: &str, new_name: &str) {
    match stmt {
        Statement::FunctionDeclaration(f) => {
            rename_identifier_in_block(&mut f.body, old_name, new_name);
        }
        Statement::VariableDeclaration(var_decl) => {
            for decl in var_decl.declarations.iter_mut() {
                if let Some(ref mut init) = decl.init {
                    rename_identifier_in_expression(init, old_name, new_name);
                }
            }
        }
        Statement::ExpressionStatement(expr_stmt) => {
            rename_identifier_in_expression(&mut expr_stmt.expression, old_name, new_name);
        }
        Statement::ExportDefaultDeclaration(export) => match export.declaration.as_mut() {
            ExportDefaultDecl::FunctionDeclaration(f) => {
                rename_identifier_in_block(&mut f.body, old_name, new_name);
            }
            ExportDefaultDecl::Expression(e) => {
                rename_identifier_in_expression(e, old_name, new_name);
            }
            _ => {}
        },
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref mut decl) = export.declaration {
                match decl.as_mut() {
                    Declaration::FunctionDeclaration(f) => {
                        rename_identifier_in_block(&mut f.body, old_name, new_name);
                    }
                    Declaration::VariableDeclaration(var_decl) => {
                        for d in var_decl.declarations.iter_mut() {
                            if let Some(ref mut init) = d.init {
                                rename_identifier_in_expression(init, old_name, new_name);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    }
}

/// Rename an identifier in a block statement body (recursive walk).
fn rename_identifier_in_block(block: &mut BlockStatement, old_name: &str, new_name: &str) {
    for stmt in block.body.iter_mut() {
        rename_identifier_in_statement(stmt, old_name, new_name);
    }
}

/// Rename an identifier in an expression (recursive walk into function bodies).
fn rename_identifier_in_expression(expr: &mut Expression, old_name: &str, new_name: &str) {
    match expr {
        Expression::Identifier(id) => {
            if id.name == old_name {
                id.name = new_name.to_string();
            }
        }
        Expression::CallExpression(call) => {
            rename_identifier_in_expression(&mut call.callee, old_name, new_name);
            for arg in call.arguments.iter_mut() {
                rename_identifier_in_expression(arg, old_name, new_name);
            }
        }
        Expression::FunctionExpression(f) => {
            rename_identifier_in_block(&mut f.body, old_name, new_name);
        }
        Expression::ArrowFunctionExpression(f) => {
            if let ArrowFunctionBody::BlockStatement(block) = f.body.as_mut() {
                rename_identifier_in_block(block, old_name, new_name);
            }
        }
        Expression::ConditionalExpression(cond) => {
            rename_identifier_in_expression(&mut cond.test, old_name, new_name);
            rename_identifier_in_expression(&mut cond.consequent, old_name, new_name);
            rename_identifier_in_expression(&mut cond.alternate, old_name, new_name);
        }
        Expression::ObjectExpression(obj) => {
            for prop in obj.properties.iter_mut() {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(p) => {
                        rename_identifier_in_expression(&mut p.value, old_name, new_name);
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        rename_identifier_in_expression(&mut s.argument, old_name, new_name);
                    }
                    _ => {}
                }
            }
        }
        Expression::ArrayExpression(arr) => {
            for elem in arr.elements.iter_mut().flatten() {
                rename_identifier_in_expression(elem, old_name, new_name);
            }
        }
        Expression::AssignmentExpression(assign) => {
            rename_identifier_in_expression(&mut assign.right, old_name, new_name);
        }
        Expression::SequenceExpression(seq) => {
            for e in seq.expressions.iter_mut() {
                rename_identifier_in_expression(e, old_name, new_name);
            }
        }
        Expression::LogicalExpression(log) => {
            rename_identifier_in_expression(&mut log.left, old_name, new_name);
            rename_identifier_in_expression(&mut log.right, old_name, new_name);
        }
        Expression::BinaryExpression(bin) => {
            rename_identifier_in_expression(&mut bin.left, old_name, new_name);
            rename_identifier_in_expression(&mut bin.right, old_name, new_name);
        }
        Expression::NewExpression(new) => {
            rename_identifier_in_expression(&mut new.callee, old_name, new_name);
            for arg in new.arguments.iter_mut() {
                rename_identifier_in_expression(arg, old_name, new_name);
            }
        }
        Expression::ParenthesizedExpression(paren) => {
            rename_identifier_in_expression(&mut paren.expression, old_name, new_name);
        }
        Expression::OptionalCallExpression(call) => {
            rename_identifier_in_expression(&mut call.callee, old_name, new_name);
            for arg in call.arguments.iter_mut() {
                rename_identifier_in_expression(arg, old_name, new_name);
            }
        }
        _ => {}
    }
}

/// Check if a statement contains a function whose BaseNode.start matches.
fn stmt_has_fn_at_start(stmt: &Statement, start: u32) -> bool {
    match stmt {
        Statement::FunctionDeclaration(f) => f.base.start == Some(start),
        Statement::VariableDeclaration(var_decl) => {
            var_decl.declarations.iter().any(|decl| {
                if let Some(ref init) = decl.init {
                    expr_has_fn_at_start(init, start)
                } else {
                    false
                }
            })
        }
        Statement::ExportDefaultDeclaration(export) => match export.declaration.as_ref() {
            ExportDefaultDecl::FunctionDeclaration(f) => f.base.start == Some(start),
            ExportDefaultDecl::Expression(e) => expr_has_fn_at_start(e, start),
            _ => false,
        },
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref decl) = export.declaration {
                match decl.as_ref() {
                    Declaration::FunctionDeclaration(f) => f.base.start == Some(start),
                    Declaration::VariableDeclaration(var_decl) => {
                        var_decl.declarations.iter().any(|d| {
                            if let Some(ref init) = d.init {
                                expr_has_fn_at_start(init, start)
                            } else {
                                false
                            }
                        })
                    }
                    _ => false,
                }
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Check if an expression contains a function whose BaseNode.start matches.
fn expr_has_fn_at_start(expr: &Expression, start: u32) -> bool {
    match expr {
        Expression::FunctionExpression(f) => f.base.start == Some(start),
        Expression::ArrowFunctionExpression(f) => f.base.start == Some(start),
        // Check for forwardRef/memo wrappers: the inner function
        Expression::CallExpression(call) => {
            call.arguments.iter().any(|arg| expr_has_fn_at_start(arg, start))
        }
        _ => false,
    }
}

/// Replace a function in the program body with its compiled version.
fn replace_function_in_program(program: &mut Program, compiled: &CompiledFnForReplacement) {
    let start = match compiled.fn_start {
        Some(s) => s,
        None => return,
    };

    for stmt in program.body.iter_mut() {
        if replace_fn_in_statement(stmt, start, compiled) {
            return;
        }
    }
}

/// Clear comments from a BaseNode so Babel doesn't emit them in the compiled output.
/// In the TS compiler, replaceWith() creates new nodes without comments; we achieve
/// the same by stripping them from replaced function nodes.
#[allow(dead_code)]
fn clear_comments(base: &mut BaseNode) {
    base.leading_comments = None;
    base.trailing_comments = None;
    base.inner_comments = None;
}

/// Try to replace a function in a statement. Returns true if replaced.
fn replace_fn_in_statement(
    stmt: &mut Statement,
    start: u32,
    compiled: &CompiledFnForReplacement,
) -> bool {
    match stmt {
        Statement::FunctionDeclaration(f) => {
            if f.base.start == Some(start) {
                f.id = compiled.codegen_fn.id.clone();
                f.params = compiled.codegen_fn.params.clone();
                f.body = compiled.codegen_fn.body.clone();
                f.generator = compiled.codegen_fn.generator;
                f.is_async = compiled.codegen_fn.is_async;
                // Clear type annotations — the TS compiler creates a fresh node
                // without returnType/typeParameters/predicate/declare
                f.return_type = None;
                f.type_parameters = None;
                f.predicate = None;
                f.declare = None;
                return true;
            }
        }
        Statement::VariableDeclaration(var_decl) => {
            for decl in var_decl.declarations.iter_mut() {
                if let Some(ref mut init) = decl.init {
                    if replace_fn_in_expression(init, start, compiled) {
                        return true;
                    }
                }
            }
        }
        Statement::ExportDefaultDeclaration(export) => {
            match export.declaration.as_mut() {
                ExportDefaultDecl::FunctionDeclaration(f) => {
                    if f.base.start == Some(start) {
                        f.id = compiled.codegen_fn.id.clone();
                        f.params = compiled.codegen_fn.params.clone();
                        f.body = compiled.codegen_fn.body.clone();
                        f.generator = compiled.codegen_fn.generator;
                        f.is_async = compiled.codegen_fn.is_async;
                        f.return_type = None;
                        f.type_parameters = None;
                        f.predicate = None;
                        f.declare = None;
                        return true;
                    }
                }
                ExportDefaultDecl::Expression(e) => {
                    if replace_fn_in_expression(e, start, compiled) {
                        return true;
                    }
                }
                _ => {}
            }
        }
        Statement::ExportNamedDeclaration(export) => {
            if let Some(ref mut decl) = export.declaration {
                match decl.as_mut() {
                    Declaration::FunctionDeclaration(f) => {
                        if f.base.start == Some(start) {
                            f.id = compiled.codegen_fn.id.clone();
                            f.params = compiled.codegen_fn.params.clone();
                            f.body = compiled.codegen_fn.body.clone();
                            f.generator = compiled.codegen_fn.generator;
                            f.is_async = compiled.codegen_fn.is_async;
                            f.return_type = None;
                            f.type_parameters = None;
                            f.predicate = None;
                            f.declare = None;
                            return true;
                        }
                    }
                    Declaration::VariableDeclaration(var_decl) => {
                        for d in var_decl.declarations.iter_mut() {
                            if let Some(ref mut init) = d.init {
                                if replace_fn_in_expression(init, start, compiled) {
                                    return true;
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Statement::ExpressionStatement(expr_stmt) => {
            if replace_fn_in_expression(&mut expr_stmt.expression, start, compiled) {
                return true;
            }
        }
        _ => {}
    }
    false
}

/// Try to replace a function in an expression. Returns true if replaced.
fn replace_fn_in_expression(
    expr: &mut Expression,
    start: u32,
    compiled: &CompiledFnForReplacement,
) -> bool {
    match expr {
        Expression::FunctionExpression(f) => {
            if f.base.start == Some(start) {
                f.id = compiled.codegen_fn.id.clone();
                f.params = compiled.codegen_fn.params.clone();
                f.body = compiled.codegen_fn.body.clone();
                f.generator = compiled.codegen_fn.generator;
                f.is_async = compiled.codegen_fn.is_async;
                // Clear type annotations — the TS compiler creates a fresh node
                f.return_type = None;
                f.type_parameters = None;
                return true;
            }
        }
        Expression::ArrowFunctionExpression(f) => {
            if f.base.start == Some(start) {
                f.params = compiled.codegen_fn.params.clone();
                f.body = Box::new(ArrowFunctionBody::BlockStatement(
                    compiled.codegen_fn.body.clone(),
                ));
                f.generator = compiled.codegen_fn.generator;
                f.is_async = compiled.codegen_fn.is_async;
                // Arrow functions always have expression: false after compilation
                // since codegen produces a BlockStatement body
                f.expression = Some(false);
                // Clear type annotations — the TS compiler creates a fresh node
                f.return_type = None;
                f.type_parameters = None;
                f.predicate = None;
                return true;
            }
        }
        // Handle forwardRef/memo wrappers: replace the inner function
        Expression::CallExpression(call) => {
            for arg in call.arguments.iter_mut() {
                if replace_fn_in_expression(arg, start, compiled) {
                    return true;
                }
            }
        }
        // Recurse into sub-expressions that may contain nested functions
        Expression::ObjectExpression(obj) => {
            for prop in obj.properties.iter_mut() {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(p) => {
                        if replace_fn_in_expression(&mut p.value, start, compiled) {
                            return true;
                        }
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        if replace_fn_in_expression(&mut s.argument, start, compiled) {
                            return true;
                        }
                    }
                    _ => {}
                }
            }
        }
        Expression::ArrayExpression(arr) => {
            for elem in arr.elements.iter_mut().flatten() {
                if replace_fn_in_expression(elem, start, compiled) {
                    return true;
                }
            }
        }
        Expression::AssignmentExpression(assign) => {
            if replace_fn_in_expression(&mut assign.right, start, compiled) {
                return true;
            }
        }
        Expression::SequenceExpression(seq) => {
            for e in seq.expressions.iter_mut() {
                if replace_fn_in_expression(e, start, compiled) {
                    return true;
                }
            }
        }
        Expression::ConditionalExpression(cond) => {
            if replace_fn_in_expression(&mut cond.consequent, start, compiled) {
                return true;
            }
            if replace_fn_in_expression(&mut cond.alternate, start, compiled) {
                return true;
            }
        }
        Expression::LogicalExpression(log) => {
            if replace_fn_in_expression(&mut log.left, start, compiled) {
                return true;
            }
            if replace_fn_in_expression(&mut log.right, start, compiled) {
                return true;
            }
        }
        Expression::BinaryExpression(bin) => {
            if replace_fn_in_expression(&mut bin.left, start, compiled) {
                return true;
            }
            if replace_fn_in_expression(&mut bin.right, start, compiled) {
                return true;
            }
        }
        Expression::UnaryExpression(unary) => {
            if replace_fn_in_expression(&mut unary.argument, start, compiled) {
                return true;
            }
        }
        Expression::NewExpression(new) => {
            for arg in new.arguments.iter_mut() {
                if replace_fn_in_expression(arg, start, compiled) {
                    return true;
                }
            }
        }
        Expression::ParenthesizedExpression(paren) => {
            if replace_fn_in_expression(&mut paren.expression, start, compiled) {
                return true;
            }
        }
        Expression::OptionalCallExpression(call) => {
            for arg in call.arguments.iter_mut() {
                if replace_fn_in_expression(arg, start, compiled) {
                    return true;
                }
            }
        }
        Expression::TSAsExpression(ts) => {
            if replace_fn_in_expression(&mut ts.expression, start, compiled) {
                return true;
            }
        }
        Expression::TSSatisfiesExpression(ts) => {
            if replace_fn_in_expression(&mut ts.expression, start, compiled) {
                return true;
            }
        }
        Expression::TSNonNullExpression(ts) => {
            if replace_fn_in_expression(&mut ts.expression, start, compiled) {
                return true;
            }
        }
        Expression::TypeCastExpression(tc) => {
            if replace_fn_in_expression(&mut tc.expression, start, compiled) {
                return true;
            }
        }
        _ => {}
    }
    false
}

/// Main entry point for the React Compiler.
///
/// Receives a full program AST, scope information (unused for now), and resolved options.
/// Returns a CompileResult indicating whether the AST was modified,
/// along with any logger events.
///
/// This function implements the logic from the TS entrypoint (Program.ts):
/// - shouldSkipCompilation: check for existing runtime imports
/// - validateRestrictedImports: check for blocklisted imports
/// - findProgramSuppressions: find eslint/flow suppression comments
/// - findFunctionsToCompile: traverse program to find components and hooks
/// - processFn: per-function compilation with directive and suppression handling
/// - applyCompiledFunctions: replace original functions with compiled versions
pub fn compile_program(mut file: File, scope: ScopeInfo, options: PluginOptions) -> CompileResult {
    // Compute output mode once, up front
    let output_mode = CompilerOutputMode::from_opts(&options);

    // Create a temporary context for early-return paths (before full context is set up)
    let early_events: Vec<LoggerEvent> = Vec::new();
    let mut early_ordered_log: Vec<OrderedLogItem> = Vec::new();

    // Log environment config for debugLogIRs
    if options.debug {
        early_ordered_log.push(OrderedLogItem::Debug {
            entry: DebugLogEntry::new(
                "EnvironmentConfig",
                serde_json::to_string_pretty(&options.environment).unwrap_or_default(),
            ),
        });
    }

    // Check if we should compile this file at all (pre-resolved by JS shim)
    if !options.should_compile {
        return CompileResult::Success {
            ast: None,
            events: early_events,
            ordered_log: early_ordered_log,
            renames: Vec::new(),
            timing: Vec::new(),
        };
    }

    let program = &file.program;

    // Check for existing runtime imports (file already compiled)
    if should_skip_compilation(program, &options) {
        return CompileResult::Success {
            ast: None,
            events: early_events,
            ordered_log: early_ordered_log,
            renames: Vec::new(),
            timing: Vec::new(),
        };
    }

    // Validate restricted imports from the environment config
    let restricted_imports = options.environment.validate_blocklisted_imports.clone();

    // Determine if we should check for eslint suppressions
    let validate_exhaustive = options.environment.validate_exhaustive_memoization_dependencies;
    let validate_hooks = options.environment.validate_hooks_usage;

    let eslint_rules: Option<Vec<String>> = if validate_exhaustive && validate_hooks {
        // Don't check for ESLint suppressions if both validations are enabled
        None
    } else {
        Some(options.eslint_suppression_rules.clone().unwrap_or_else(|| {
            DEFAULT_ESLINT_SUPPRESSIONS
                .iter()
                .map(|s| s.to_string())
                .collect()
        }))
    };

    // Find program-level suppressions from comments
    let suppressions = find_program_suppressions(
        &file.comments,
        eslint_rules.as_deref(),
        options.flow_suppressions,
    );

    // Check for module-scope opt-out directive
    let has_module_scope_opt_out =
        find_directive_disabling_memoization(&program.directives, &options).is_some();

    // Create program context
    let mut context = ProgramContext::new(
        options.clone(),
        options.filename.clone(),
        // Pass the source code for fast refresh hash computation.
        options.source_code.clone(),
        suppressions,
        has_module_scope_opt_out,
    );

    // Extract the source filename from the AST (set by parser's sourceFilename option).
    // This is the bare filename (e.g., "foo.ts") without path prefixes, which the TS
    // compiler uses in logger event source locations.
    let source_filename = program.base.loc.as_ref().and_then(|loc| loc.filename.clone())
        .or_else(|| {
            // Fallback: try the first statement's loc
            program.body.first().and_then(|stmt| {
                let base = match stmt {
                    react_compiler_ast::statements::Statement::ExpressionStatement(s) => &s.base,
                    react_compiler_ast::statements::Statement::VariableDeclaration(s) => &s.base,
                    react_compiler_ast::statements::Statement::FunctionDeclaration(s) => &s.base,
                    _ => return None,
                };
                base.loc.as_ref().and_then(|loc| loc.filename.clone())
            })
        });
    context.set_source_filename(source_filename);

    // Initialize known referenced names from scope bindings for UID collision detection
    context.init_from_scope(&scope);

    // Seed context with early ordered log entries
    context.ordered_log.extend(early_ordered_log);

    // Validate restricted imports (needs context for handle_error)
    if let Some(err) = validate_restricted_imports(program, &restricted_imports) {
        if let Some(result) = handle_error(&err, None, &mut context) {
            return result;
        }
        return CompileResult::Success {
            ast: None,
            events: context.events,
            ordered_log: context.ordered_log,
            renames: convert_renames(&context.renames),
            timing: Vec::new(),
        };
    }

    // Pre-register instrumentation imports to get stable local names.
    // These are needed before compilation so codegen can use the correct names.
    let instrument_fn_name: Option<String>;
    let instrument_gating_name: Option<String>;
    let hook_guard_name: Option<String>;

    if let Some(ref instrument_config) = options.environment.enable_emit_instrument_forget {
        let fn_spec = context.add_import_specifier(
            &instrument_config.fn_.source,
            &instrument_config.fn_.import_specifier_name,
            None,
        );
        instrument_fn_name = Some(fn_spec.name.clone());
        instrument_gating_name = instrument_config.gating.as_ref().map(|g| {
            let spec = context.add_import_specifier(&g.source, &g.import_specifier_name, None);
            spec.name.clone()
        });
    } else {
        instrument_fn_name = None;
        instrument_gating_name = None;
    }

    if let Some(ref hook_guard_config) = options.environment.enable_emit_hook_guards {
        let spec = context.add_import_specifier(
            &hook_guard_config.source,
            &hook_guard_config.import_specifier_name,
            None,
        );
        hook_guard_name = Some(spec.name.clone());
    } else {
        hook_guard_name = None;
    }

    // Store pre-resolved names on context for pipeline access
    context.instrument_fn_name = instrument_fn_name;
    context.instrument_gating_name = instrument_gating_name;
    context.hook_guard_name = hook_guard_name;

    // Find all functions to compile
    let queue = find_functions_to_compile(program, &options, &mut context);

    // Clone env_config once for all function compilations (avoids per-function clone
    // while satisfying the borrow checker — compile_fn needs &mut context + &env_config)
    let env_config = options.environment.clone();

    // Process each function and collect compiled results
    let mut compiled_fns: Vec<CompiledFunction<'_>> = Vec::new();

    for source in &queue {
        match process_fn(source, &scope, output_mode, &env_config, &mut context) {
            Ok(Some(codegen_fn)) => {
                compiled_fns.push(CompiledFunction {
                    kind: source.kind,
                    source,
                    codegen_fn,
                });
            }
            Ok(None) => {
                // Function was skipped or lint-only
            }
            Err(fatal_result) => {
                return fatal_result;
            }
        }
    }

    // TS invariant: if there's a module scope opt-out, no functions should have been compiled
    if has_module_scope_opt_out {
        if !compiled_fns.is_empty() {
            let mut err = CompilerError::new();
            err.push_error_detail(CompilerErrorDetail::new(
                ErrorCategory::Invariant,
                "Unexpected compiled functions when module scope opt-out is present",
            ));
            handle_error(&err, None, &mut context);
        }
        return CompileResult::Success {
            ast: None,
            events: context.events,
            ordered_log: context.ordered_log,
            renames: convert_renames(&context.renames),
            timing: Vec::new(),
        };
    }

    // Determine gating for each compiled function.
    // In the TS compiler, dynamic gating from directives takes precedence over plugin-level gating.
    // Gating only applies to 'original' functions, not 'outlined' ones.
    let function_gating_config = options.gating.clone();

    // Convert compiled functions to owned representations (dropping borrows)
    // so we can mutate the AST.
    let replacements: Vec<CompiledFnForReplacement> = compiled_fns
        .into_iter()
        .map(|cf| {
            let original_kind = match cf.source.fn_node {
                FunctionNode::FunctionDeclaration(_) => OriginalFnKind::FunctionDeclaration,
                FunctionNode::FunctionExpression(_) => OriginalFnKind::FunctionExpression,
                FunctionNode::ArrowFunctionExpression(_) => OriginalFnKind::ArrowFunctionExpression,
            };
            // Determine per-function gating: dynamic gating from directives OR plugin-level gating.
            // Dynamic gating (from `use memo if(identifier)`) takes precedence.
            let gating = if cf.kind == CompileSourceKind::Original {
                // Check body directives for dynamic gating
                let dynamic_gating = find_directives_dynamic_gating(
                    &cf.source.body_directives,
                    &options,
                )
                .ok()
                .flatten()
                .map(|r| r.gating);
                dynamic_gating.or_else(|| function_gating_config.clone())
            } else {
                None
            };
            CompiledFnForReplacement {
                fn_start: cf.source.fn_start,
                original_kind,
                codegen_fn: cf.codegen_fn,
                source_kind: cf.kind,
                fn_name: cf.source.fn_name.clone(),
                gating,
            }
        })
        .collect();
    // Drop queue (and its borrows from file.program)
    drop(queue);

    if replacements.is_empty() {
        // No functions to replace. Return renames for the Babel plugin to apply
        // (e.g., variable shadowing renames in lint mode). Imports are NOT added
        // when there are no replacements — matching TS behavior where
        // addImportsToProgram is only called when compiledFns.length > 0.
        return CompileResult::Success {
            ast: None,
            events: context.events,
            ordered_log: context.ordered_log,
            renames: convert_renames(&context.renames),
            timing: Vec::new(),
        };
    }

    // Now we can mutate file.program
    apply_compiled_functions(&replacements, &mut file.program, &mut context);

    // Serialize the modified File AST directly to a JSON string and wrap as RawValue.
    // This avoids double-serialization (File→Value→String) by going File→String directly.
    // The RawValue is embedded verbatim when the CompileResult is serialized.
    let ast = match serde_json::to_string(&file) {
        Ok(s) => match serde_json::value::RawValue::from_string(s) {
            Ok(raw) => Some(raw),
            Err(e) => {
                eprintln!("RUST COMPILER: Failed to create RawValue: {}", e);
                None
            }
        },
        Err(e) => {
            eprintln!("RUST COMPILER: Failed to serialize AST: {}", e);
            None
        }
    };

    let timing_entries = context.timing.into_entries();

    CompileResult::Success {
        ast,
        events: context.events,
        ordered_log: context.ordered_log,
        renames: convert_renames(&context.renames),
        timing: timing_entries,
    }
}

/// Convert internal BindingRename structs to the serializable BindingRenameInfo format.
fn convert_renames(renames: &[react_compiler_hir::environment::BindingRename]) -> Vec<BindingRenameInfo> {
    renames.iter().map(|r| BindingRenameInfo {
        original: r.original.clone(),
        renamed: r.renamed.clone(),
        declaration_start: r.declaration_start,
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_hook_name() {
        assert!(is_hook_name("useState"));
        assert!(is_hook_name("useEffect"));
        assert!(is_hook_name("use0Something"));
        assert!(!is_hook_name("use"));
        assert!(!is_hook_name("useless")); // lowercase after use
        assert!(!is_hook_name("foo"));
        assert!(!is_hook_name(""));
    }

    #[test]
    fn test_is_component_name() {
        assert!(is_component_name("MyComponent"));
        assert!(is_component_name("App"));
        assert!(!is_component_name("myComponent"));
        assert!(!is_component_name("app"));
        assert!(!is_component_name(""));
    }

    #[test]
    fn test_is_valid_identifier() {
        assert!(is_valid_identifier("foo"));
        assert!(is_valid_identifier("_bar"));
        assert!(is_valid_identifier("$baz"));
        assert!(is_valid_identifier("foo123"));
        assert!(!is_valid_identifier(""));
        assert!(!is_valid_identifier("123foo"));
        assert!(!is_valid_identifier("foo bar"));
    }

    #[test]
    fn test_is_valid_component_params_empty() {
        assert!(is_valid_component_params(&[]));
    }

    #[test]
    fn test_is_valid_component_params_one_identifier() {
        let params = vec![PatternLike::Identifier(Identifier {
            base: BaseNode::default(),
            name: "props".to_string(),
            type_annotation: None,
            optional: None,
            decorators: None,
        })];
        assert!(is_valid_component_params(&params));
    }

    #[test]
    fn test_is_valid_component_params_too_many() {
        let params = vec![
            PatternLike::Identifier(Identifier {
                base: BaseNode::default(),
                name: "a".to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
            PatternLike::Identifier(Identifier {
                base: BaseNode::default(),
                name: "b".to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
            PatternLike::Identifier(Identifier {
                base: BaseNode::default(),
                name: "c".to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
        ];
        assert!(!is_valid_component_params(&params));
    }

    #[test]
    fn test_is_valid_component_params_with_ref() {
        let params = vec![
            PatternLike::Identifier(Identifier {
                base: BaseNode::default(),
                name: "props".to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
            PatternLike::Identifier(Identifier {
                base: BaseNode::default(),
                name: "ref".to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            }),
        ];
        assert!(is_valid_component_params(&params));
    }

    #[test]
    fn test_should_skip_compilation_no_import() {
        let program = Program {
            base: BaseNode::default(),
            body: vec![],
            directives: vec![],
            source_type: react_compiler_ast::SourceType::Module,
            interpreter: None,
            source_file: None,
        };
        let options = PluginOptions {
            should_compile: true,
            enable_reanimated: false,
            is_dev: false,
            filename: None,
            compilation_mode: "infer".to_string(),
            panic_threshold: "none".to_string(),
            target: super::super::plugin_options::CompilerTarget::Version("19".to_string()),
            gating: None,
            dynamic_gating: None,
            no_emit: false,
            output_mode: None,
            eslint_suppression_rules: None,
            flow_suppressions: true,
            ignore_use_no_forget: false,
            custom_opt_out_directives: None,
            environment: EnvironmentConfig::default(),
        };
        assert!(!should_skip_compilation(&program, &options));
    }
}
