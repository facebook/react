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

use react_compiler_ast::common::BaseNode;
use react_compiler_ast::declarations::{
    Declaration, ExportDefaultDecl, ImportSpecifier, ModuleExportName,
};
use react_compiler_ast::expressions::*;
use react_compiler_ast::patterns::PatternLike;
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::statements::*;
use react_compiler_ast::{File, Program};
use react_compiler_diagnostics::SourceLocation;
use react_compiler_hir::ReactFunctionType;
use react_compiler_lowering::FunctionNode;
use regex::Regex;

use super::compile_result::{CompileResult, CompilerErrorDetailInfo, CompilerErrorInfo, DebugLogEntry, LoggerEvent};
use super::imports::{
    get_react_compiler_runtime_module, validate_restricted_imports, ProgramContext,
};
use super::pipeline;
use super::plugin_options::PluginOptions;
use super::suppression::{
    filter_suppressions_that_affect_function, find_program_suppressions,
    suppressions_to_compiler_error, SuppressionRange,
};

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------

const DEFAULT_ESLINT_SUPPRESSIONS: &[&str] = &[
    "react-hooks/exhaustive-deps",
    "react-hooks/rules-of-hooks",
];

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

/// Result of attempting to compile a function
enum TryCompileResult {
    /// Compilation succeeded, with debug log entries from the pipeline
    Compiled { debug_logs: Vec<DebugLogEntry> },
    /// Compilation produced an error
    Error(CompileError),
}

/// Represents a compilation error (either a structured CompilerError or an opaque error)
#[allow(dead_code)]
enum CompileError {
    Structured(CompilerErrorInfo),
    Opaque(String),
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
) -> Result<Option<&'a Directive>, CompileError> {
    // Check standard opt-in directives
    let opt_in = directives
        .iter()
        .find(|d| OPT_IN_DIRECTIVES.contains(&d.value.value.as_str()));
    if let Some(directive) = opt_in {
        return Ok(Some(directive));
    }

    // Check dynamic gating directives
    match find_directives_dynamic_gating(directives, opts) {
        Ok(Some(directive)) => Ok(Some(directive)),
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

/// Check for dynamic gating directives like `use memo if(identifier)`.
/// Returns the directive if found, or an error if the directive is malformed.
fn find_directives_dynamic_gating<'a>(
    directives: &'a [Directive],
    opts: &PluginOptions,
) -> Result<Option<&'a Directive>, CompileError> {
    if opts.dynamic_gating.is_none() {
        return Ok(None);
    }

    let pattern = Regex::new(r"^use memo if\(([^\)]*)\)$").expect("Invalid dynamic gating regex");

    let mut errors: Vec<String> = Vec::new();
    let mut matches: Vec<(&'a Directive, String)> = Vec::new();

    for directive in directives {
        if let Some(caps) = pattern.captures(&directive.value.value) {
            if let Some(m) = caps.get(1) {
                let ident = m.as_str();
                if is_valid_identifier(ident) {
                    matches.push((directive, ident.to_string()));
                } else {
                    errors.push(format!(
                        "Dynamic gating directive is not a valid JavaScript identifier: '{}'",
                        directive.value.value
                    ));
                }
            }
        }
    }

    if !errors.is_empty() {
        return Err(CompileError::Structured(CompilerErrorInfo {
            reason: errors[0].clone(),
            description: None,
            details: errors
                .into_iter()
                .map(|e| CompilerErrorDetailInfo {
                    category: "Gating".to_string(),
                    reason: e,
                    description: None,
                    loc: None,
                })
                .collect(),
        }));
    }

    if matches.len() > 1 {
        let names: Vec<String> = matches.iter().map(|(d, _)| d.value.value.clone()).collect();
        return Err(CompileError::Structured(CompilerErrorInfo {
            reason: "Multiple dynamic gating directives found".to_string(),
            description: Some(format!(
                "Expected a single directive but found [{}]",
                names.join(", ")
            )),
            details: vec![CompilerErrorDetailInfo {
                category: "Gating".to_string(),
                reason: "Multiple dynamic gating directives found".to_string(),
                description: Some(format!(
                    "Expected a single directive but found [{}]",
                    names.join(", ")
                )),
                loc: None,
            }],
        }));
    }

    if matches.len() == 1 {
        Ok(Some(matches[0].0))
    } else {
        Ok(None)
    }
}

/// Simple check for valid JavaScript identifier (alphanumeric + underscore + $, starting with letter/$/_ )
fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    let mut chars = s.chars();
    let first = chars.next().unwrap();
    if !first.is_alphabetic() && first != '_' && first != '$' {
        return false;
    }
    chars.all(|c| c.is_alphanumeric() || c == '_' || c == '$')
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
fn returns_non_node_fn(
    params: &[PatternLike],
    body: &FunctionBody,
) -> bool {
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
        Statement::LabeledStatement(labeled) => {
            calls_hooks_or_creates_jsx_in_stmt(&labeled.body)
        }
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
            if expr_is_hook(&call.callee) {
                return true;
            }
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
        Expression::SequenceExpression(seq) => {
            seq.expressions
                .iter()
                .any(|e| calls_hooks_or_creates_jsx_in_expr(e))
        }
        Expression::UnaryExpression(unary) => {
            calls_hooks_or_creates_jsx_in_expr(&unary.argument)
        }
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
        Expression::SpreadElement(spread) => {
            calls_hooks_or_creates_jsx_in_expr(&spread.argument)
        }
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
            // ObjectMethod is a nested function scope, skip
            ObjectExpressionProperty::ObjectMethod(_) => false,
        }),
        Expression::ParenthesizedExpression(paren) => {
            calls_hooks_or_creates_jsx_in_expr(&paren.expression)
        }
        Expression::TSAsExpression(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSSatisfiesExpression(ts) => {
            calls_hooks_or_creates_jsx_in_expr(&ts.expression)
        }
        Expression::TSNonNullExpression(ts) => {
            calls_hooks_or_creates_jsx_in_expr(&ts.expression)
        }
        Expression::TSTypeAssertion(ts) => calls_hooks_or_creates_jsx_in_expr(&ts.expression),
        Expression::TSInstantiationExpression(ts) => {
            calls_hooks_or_creates_jsx_in_expr(&ts.expression)
        }
        Expression::TypeCastExpression(tc) => {
            calls_hooks_or_creates_jsx_in_expr(&tc.expression)
        }
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
                get_component_or_hook_like(name, params, body, parent_callee_name).unwrap_or(ReactFunctionType::Other),
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
        },
        end: react_compiler_diagnostics::Position {
            line: loc.end.line,
            column: loc.end.column,
        },
    }
}

fn base_node_loc(base: &BaseNode) -> Option<SourceLocation> {
    base.loc.as_ref().map(convert_loc)
}

// -----------------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------------

/// Log an error as a LoggerEvent
fn log_error(err: &CompileError, fn_loc: Option<SourceLocation>) -> Vec<LoggerEvent> {
    let mut events = Vec::new();
    match err {
        CompileError::Structured(info) => {
            for detail in &info.details {
                events.push(LoggerEvent::CompileError {
                    fn_loc: fn_loc.clone(),
                    detail: detail.clone(),
                });
            }
        }
        CompileError::Opaque(msg) => {
            events.push(LoggerEvent::PipelineError {
                fn_loc,
                data: msg.clone(),
            });
        }
    }
    events
}

/// Handle an error according to the panicThreshold setting.
/// Returns Some(CompileResult::Error) if the error should be surfaced as fatal,
/// otherwise returns None (error was logged only).
fn handle_error(
    err: &CompileError,
    opts: &PluginOptions,
    fn_loc: Option<SourceLocation>,
    events: &mut Vec<LoggerEvent>,
    debug_logs: &Vec<DebugLogEntry>,
) -> Option<CompileResult> {
    // Log the error
    events.extend(log_error(err, fn_loc.clone()));

    let should_panic = match opts.panic_threshold.as_str() {
        "all_errors" => true,
        "critical_errors" => {
            // Only panic for real errors (not warnings)
            matches!(err, CompileError::Opaque(_))
                || matches!(err, CompileError::Structured(info) if !info.details.is_empty())
        }
        _ => false,
    };

    // Config errors always cause a panic
    let is_config_error = matches!(err, CompileError::Structured(info)
        if info.details.iter().any(|d| d.category == "Config"));

    if should_panic || is_config_error {
        let error_info = match err {
            CompileError::Structured(info) => info.clone(),
            CompileError::Opaque(msg) => CompilerErrorInfo {
                reason: msg.clone(),
                description: None,
                details: vec![CompilerErrorDetailInfo {
                    category: "Unknown".to_string(),
                    reason: msg.clone(),
                    description: None,
                    loc: None,
                }],
            },
        };
        Some(CompileResult::Error {
            error: error_info,
            events: events.clone(),
            debug_logs: debug_logs.clone(),
        })
    } else {
        None
    }
}

// -----------------------------------------------------------------------
// Compilation pipeline stubs
// -----------------------------------------------------------------------

/// Attempt to compile a single function.
///
/// Currently returns NotImplemented since the compilation pipeline (HIR lowering,
/// optimization passes, codegen) is not yet ported to Rust.
fn try_compile_function(
    source: &CompileSource<'_>,
    scope_info: &ScopeInfo,
    suppressions: &[SuppressionRange],
    options: &PluginOptions,
) -> TryCompileResult {
    // Check for suppressions that affect this function
    if let (Some(start), Some(end)) = (source.fn_start, source.fn_end) {
        let affecting = filter_suppressions_that_affect_function(suppressions, start, end);
        if !affecting.is_empty() {
            let owned: Vec<SuppressionRange> = affecting.into_iter().cloned().collect();
            let compiler_error = suppressions_to_compiler_error(&owned);
            // Convert the CompilerError into our CompileError type
            let details: Vec<CompilerErrorDetailInfo> = compiler_error
                .details()
                .iter()
                .map(|d| CompilerErrorDetailInfo {
                    category: format!("{:?}", d.category),
                    reason: d.reason.clone(),
                    description: d.description.clone(),
                    loc: d.loc.clone(),
                })
                .collect();
            return TryCompileResult::Error(CompileError::Structured(CompilerErrorInfo {
                reason: "Suppression found".to_string(),
                description: None,
                details,
            }));
        }
    }

    // Run the compilation pipeline
    match pipeline::compile_fn(
        &source.fn_node,
        source.fn_name.as_deref(),
        scope_info,
        source.fn_type,
        options,
    ) {
        Ok(debug_logs) => TryCompileResult::Compiled { debug_logs },
        Err(pipeline::CompileError::Lowering(msg)) => {
            TryCompileResult::Error(CompileError::Structured(CompilerErrorInfo {
                reason: "Lowering error".to_string(),
                description: Some(msg),
                details: vec![],
            }))
        }
    }
}

/// Process a single function: check directives, attempt compilation, handle results.
///
/// Returns logger events and any debug log entries from the pipeline.
fn process_fn(
    source: &CompileSource<'_>,
    scope_info: &ScopeInfo,
    context: &ProgramContext,
    opts: &PluginOptions,
) -> (Vec<LoggerEvent>, Vec<DebugLogEntry>) {
    let mut events = Vec::new();
    let mut debug_logs = Vec::new();

    // Parse directives from the function body
    let opt_in_result =
        try_find_directive_enabling_memoization(&source.body_directives, opts);
    let opt_out = find_directive_disabling_memoization(&source.body_directives, opts);

    // If parsing opt-in directive fails, handle the error and skip
    let opt_in = match opt_in_result {
        Ok(d) => d,
        Err(err) => {
            events.extend(log_error(&err, source.fn_loc.clone()));
            return (events, debug_logs);
        }
    };

    // Attempt compilation
    let compile_result = try_compile_function(
        source,
        scope_info,
        &context.suppressions,
        opts,
    );

    match compile_result {
        TryCompileResult::Error(err) => {
            if opt_out.is_some() {
                // If there's an opt-out, just log the error (don't escalate)
                events.extend(log_error(&err, source.fn_loc.clone()));
            } else {
                // Use handle_error logic (simplified since we can't throw)
                events.extend(log_error(&err, source.fn_loc.clone()));
            }
            return (events, debug_logs);
        }
        TryCompileResult::Compiled { debug_logs: fn_debug_logs } => {
            debug_logs.extend(fn_debug_logs);

            // Emit a CompileSkip event since optimization passes aren't implemented yet
            events.push(LoggerEvent::CompileSkip {
                fn_loc: source.fn_loc.clone(),
                reason: "Rust compilation pipeline incomplete (lowering only)".to_string(),
                loc: None,
            });
            // When the pipeline is implemented, this path will:
            // 1. Check opt-out directives
            // 2. Log CompileSuccess
            // 3. Check module scope opt-out
            // 4. Check output mode
            // 5. Check compilation mode + opt-in

            // Check opt-out
            if !opts.ignore_use_no_forget && opt_out.is_some() {
                let opt_out_value = &opt_out.unwrap().value.value;
                events.push(LoggerEvent::CompileSkip {
                    fn_loc: source.fn_loc.clone(),
                    reason: format!("Skipped due to '{}' directive.", opt_out_value),
                    loc: opt_out.and_then(|d| d.base.loc.as_ref().map(convert_loc)),
                });
                return (events, debug_logs);
            }

            // Log success (placeholder values)
            events.push(LoggerEvent::CompileSuccess {
                fn_loc: source.fn_loc.clone(),
                fn_name: source.fn_name.clone(),
                memo_slots: 0,
                memo_blocks: 0,
                memo_values: 0,
                pruned_memo_blocks: 0,
                pruned_memo_values: 0,
            });

            // Check module scope opt-out
            if context.has_module_scope_opt_out {
                return (events, debug_logs);
            }

            // Check output mode
            let output_mode = opts
                .output_mode
                .as_deref()
                .unwrap_or(if opts.no_emit { "lint" } else { "client" });
            if output_mode == "lint" {
                return (events, debug_logs);
            }

            // Check annotation mode
            if opts.compilation_mode == "annotation" && opt_in.is_none() {
                return (events, debug_logs);
            }

            // Here we would apply the compiled function to the AST
            (events, debug_logs)
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
        name: expr
            .id
            .as_ref()
            .map(|id| id.name.clone())
            .or(inferred_name),
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
                                let info = fn_info_from_func_expr(
                                    func,
                                    inferred_name,
                                    None,
                                );
                                if let Some(source) =
                                    try_make_compile_source(info, opts, context)
                                {
                                    queue.push(source);
                                }
                            }
                            Expression::ArrowFunctionExpression(arrow) => {
                                let info = fn_info_from_arrow(
                                    arrow,
                                    inferred_name,
                                    None,
                                );
                                if let Some(source) =
                                    try_make_compile_source(info, opts, context)
                                {
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
                    ExportDefaultDecl::Expression(expr) => {
                        match expr.as_ref() {
                            Expression::FunctionExpression(func) => {
                                let info = fn_info_from_func_expr(func, None, None);
                                if let Some(source) =
                                    try_make_compile_source(info, opts, context)
                                {
                                    queue.push(source);
                                }
                            }
                            Expression::ArrowFunctionExpression(arrow) => {
                                let info = fn_info_from_arrow(arrow, None, None);
                                if let Some(source) =
                                    try_make_compile_source(info, opts, context)
                                {
                                    queue.push(source);
                                }
                            }
                            other => {
                                if let Some(info) =
                                    try_extract_wrapped_function(other, None)
                                {
                                    if let Some(source) =
                                        try_make_compile_source(info, opts, context)
                                    {
                                        queue.push(source);
                                    }
                                }
                            }
                        }
                    }
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
                            if let Some(source) =
                                try_make_compile_source(info, opts, context)
                            {
                                queue.push(source);
                            }
                        }
                        Declaration::VariableDeclaration(var_decl) => {
                            for decl in &var_decl.declarations {
                                if let Some(ref init) = decl.init {
                                    let inferred_name = get_declarator_name(decl);

                                    match init.as_ref() {
                                        Expression::FunctionExpression(func) => {
                                            let info = fn_info_from_func_expr(
                                                func,
                                                inferred_name,
                                                None,
                                            );
                                            if let Some(source) =
                                                try_make_compile_source(info, opts, context)
                                            {
                                                queue.push(source);
                                            }
                                        }
                                        Expression::ArrowFunctionExpression(arrow) => {
                                            let info = fn_info_from_arrow(
                                                arrow,
                                                inferred_name,
                                                None,
                                            );
                                            if let Some(source) =
                                                try_make_compile_source(info, opts, context)
                                            {
                                                queue.push(source);
                                            }
                                        }
                                        other => {
                                            if let Some(info) = try_extract_wrapped_function(
                                                other,
                                                inferred_name,
                                            ) {
                                                if let Some(source) =
                                                    try_make_compile_source(info, opts, context)
                                                {
                                                    queue.push(source);
                                                }
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

            // All other statement types are ignored (imports, type declarations, etc.)
            _ => {}
        }
    }

    queue
}

// -----------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------

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
///
/// Currently, the actual compilation pipeline (compileFn) is not yet implemented,
/// so all functions are skipped with a "not yet implemented" event.
pub fn compile_program(
    file: File,
    scope: ScopeInfo,
    options: PluginOptions,
) -> CompileResult {
    let mut events: Vec<LoggerEvent> = Vec::new();
    let mut debug_logs: Vec<DebugLogEntry> = Vec::new();

    // Log environment config for debugLogIRs
    debug_logs.push(DebugLogEntry::new(
        "EnvironmentConfig",
        serde_json::to_string_pretty(&options.environment).unwrap_or_default(),
    ));

    // Check if we should compile this file at all (pre-resolved by JS shim)
    if !options.should_compile {
        return CompileResult::Success {
            ast: None,
            events,
            debug_logs,
        };
    }

    let program = &file.program;

    // Check for existing runtime imports (file already compiled)
    if should_skip_compilation(program, &options) {
        return CompileResult::Success {
            ast: None,
            events,
            debug_logs,
        };
    }

    // Validate restricted imports from the environment config
    let restricted_imports: Option<Vec<String>> = options
        .environment
        .get("restrictedImports")
        .and_then(|v| serde_json::from_value(v.clone()).ok());
    if let Some(err) = validate_restricted_imports(program, &restricted_imports) {
        // Convert CompilerError to our error type
        let details: Vec<CompilerErrorDetailInfo> = err
            .details()
            .iter()
            .map(|d| CompilerErrorDetailInfo {
                category: format!("{:?}", d.category),
                reason: d.reason.clone(),
                description: d.description.clone(),
                loc: d.loc.clone(),
            })
            .collect();
        let compile_err = CompileError::Structured(CompilerErrorInfo {
            reason: "Restricted import found".to_string(),
            description: None,
            details,
        });
        if let Some(result) = handle_error(&compile_err, &options, None, &mut events, &debug_logs) {
            return result;
        }
        return CompileResult::Success {
            ast: None,
            events,
            debug_logs,
        };
    }

    // Determine if we should check for eslint suppressions
    let validate_exhaustive = options
        .environment
        .get("validateExhaustiveMemoizationDependencies")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let validate_hooks = options
        .environment
        .get("validateHooksUsage")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let eslint_rules: Option<Vec<String>> = if validate_exhaustive && validate_hooks {
        // Don't check for ESLint suppressions if both validations are enabled
        None
    } else {
        Some(
            options
                .eslint_suppression_rules
                .clone()
                .unwrap_or_else(|| {
                    DEFAULT_ESLINT_SUPPRESSIONS
                        .iter()
                        .map(|s| s.to_string())
                        .collect()
                }),
        )
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
        None, // code is not needed for Rust compilation
        suppressions,
        has_module_scope_opt_out,
    );

    // Find all functions to compile
    let queue = find_functions_to_compile(program, &options, &mut context);

    // Determine output mode
    let _output_mode = options
        .output_mode
        .as_deref()
        .unwrap_or(if options.no_emit { "lint" } else { "client" });

    // Process each function
    for source in &queue {
        let (fn_events, fn_debug_logs) = process_fn(source, &scope, &context, &options);
        events.extend(fn_events);
        debug_logs.extend(fn_debug_logs);
    }

    // If there's a module scope opt-out and we somehow compiled functions,
    // that's an error
    if has_module_scope_opt_out {
        // No functions should have been compiled due to the opt-out
        return CompileResult::Success {
            ast: None,
            events,
            debug_logs,
        };
    }

    // Take events from context (if any were logged there directly)
    events.extend(context.events.drain(..));

    // No changes to AST yet (pipeline not implemented)
    CompileResult::Success {
        ast: None,
        events,
        debug_logs,
    }
}

// -----------------------------------------------------------------------
// Trait for accessing CompilerError details
// -----------------------------------------------------------------------

/// Extension trait to access details from CompilerError (from react_compiler_diagnostics)
trait CompilerErrorExt {
    fn details(&self) -> Vec<CompilerErrorDetailView>;
}

struct CompilerErrorDetailView {
    category: String,
    reason: String,
    description: Option<String>,
    loc: Option<SourceLocation>,
}

impl CompilerErrorExt for react_compiler_diagnostics::CompilerError {
    fn details(&self) -> Vec<CompilerErrorDetailView> {
        // Extract details from the CompilerError's diagnostics
        self.details
            .iter()
            .map(|d| {
                let (category, reason, description, loc) = match d {
                    react_compiler_diagnostics::CompilerErrorOrDiagnostic::ErrorDetail(detail) => (
                        format!("{:?}", detail.category),
                        detail.reason.clone(),
                        detail.description.clone(),
                        detail.loc.clone(),
                    ),
                    react_compiler_diagnostics::CompilerErrorOrDiagnostic::Diagnostic(diag) => (
                        format!("{:?}", diag.category),
                        diag.reason.clone(),
                        diag.description.clone(),
                        diag.primary_location().cloned(),
                    ),
                };
                CompilerErrorDetailView {
                    category,
                    reason,
                    description,
                    loc,
                }
            })
            .collect()
    }
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
            environment: serde_json::Value::Object(serde_json::Map::new()),
        };
        assert!(!should_skip_compilation(&program, &options));
    }
}
