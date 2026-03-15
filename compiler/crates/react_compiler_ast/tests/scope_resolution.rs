use std::path::PathBuf;

use react_compiler_ast::declarations::*;
use react_compiler_ast::expressions::*;
use react_compiler_ast::jsx::*;
use react_compiler_ast::patterns::*;
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::statements::*;

fn get_fixture_json_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("FIXTURE_JSON_DIR") {
        return PathBuf::from(dir);
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")
}

/// Recursively sort all keys in a JSON value for order-independent comparison.
fn normalize_json(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut sorted: Vec<(String, serde_json::Value)> = map
                .iter()
                .map(|(k, v)| (k.clone(), normalize_json(v)))
                .collect();
            sorted.sort_by(|a, b| a.0.cmp(&b.0));
            serde_json::Value::Object(sorted.into_iter().collect())
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(normalize_json).collect())
        }
        serde_json::Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                if f.fract() == 0.0 && f.is_finite() && f.abs() < (i64::MAX as f64) {
                    serde_json::Value::Number(serde_json::Number::from(f as i64))
                } else {
                    value.clone()
                }
            } else {
                value.clone()
            }
        }
        other => other.clone(),
    }
}

fn compute_diff(original: &str, round_tripped: &str) -> String {
    use similar::{ChangeTag, TextDiff};
    let diff = TextDiff::from_lines(original, round_tripped);
    let mut output = String::new();
    let mut lines_written = 0;
    const MAX_DIFF_LINES: usize = 50;
    for change in diff.iter_all_changes() {
        if lines_written >= MAX_DIFF_LINES {
            output.push_str("... (diff truncated)\n");
            break;
        }
        let sign = match change.tag() {
            ChangeTag::Delete => "-",
            ChangeTag::Insert => "+",
            ChangeTag::Equal => continue,
        };
        output.push_str(&format!("{sign} {change}"));
        lines_written += 1;
    }
    output
}

#[test]
fn scope_info_round_trip() {
    let json_dir = get_fixture_json_dir();
    let mut failures: Vec<(String, String)> = Vec::new();
    let mut total = 0;
    let mut passed = 0;
    let mut skipped = 0;

    for entry in walkdir::WalkDir::new(&json_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().extension().is_some_and(|ext| ext == "json")
                && !e.path().to_string_lossy().contains(".scope.")
                && !e.path().to_string_lossy().contains(".renamed.")
        })
    {
        let ast_path_str = entry.path().to_string_lossy().to_string();
        let scope_path_str = ast_path_str.replace(".json", ".scope.json");
        let scope_path = std::path::Path::new(&scope_path_str);

        if !scope_path.exists() {
            skipped += 1;
            continue;
        }

        let fixture_name = entry
            .path()
            .strip_prefix(&json_dir)
            .unwrap()
            .display()
            .to_string();
        total += 1;

        let scope_json = std::fs::read_to_string(scope_path).unwrap();

        let scope_info: react_compiler_ast::scope::ScopeInfo =
            match serde_json::from_str(&scope_json) {
                Ok(info) => info,
                Err(e) => {
                    failures.push((fixture_name, format!("Scope deserialization error: {e}")));
                    continue;
                }
            };

        let round_tripped = serde_json::to_string_pretty(&scope_info).unwrap();
        let original_value: serde_json::Value = serde_json::from_str(&scope_json).unwrap();
        let round_tripped_value: serde_json::Value =
            serde_json::from_str(&round_tripped).unwrap();

        let original_normalized = normalize_json(&original_value);
        let round_tripped_normalized = normalize_json(&round_tripped_value);

        if original_normalized != round_tripped_normalized {
            let orig_str = serde_json::to_string_pretty(&original_normalized).unwrap();
            let rt_str = serde_json::to_string_pretty(&round_tripped_normalized).unwrap();
            let diff = compute_diff(&orig_str, &rt_str);
            failures.push((fixture_name, format!("Round-trip mismatch:\n{diff}")));
            continue;
        }

        let mut consistency_error = None;

        for binding in &scope_info.bindings {
            if binding.scope.0 as usize >= scope_info.scopes.len() {
                consistency_error = Some(format!(
                    "Binding {} has scope {} but only {} scopes exist",
                    binding.name, binding.scope.0, scope_info.scopes.len()
                ));
                break;
            }
        }

        if consistency_error.is_none() {
            for scope in &scope_info.scopes {
                for (name, &bid) in &scope.bindings {
                    if bid.0 as usize >= scope_info.bindings.len() {
                        consistency_error = Some(format!(
                            "Scope {} has binding '{}' with id {} but only {} bindings exist",
                            scope.id.0, name, bid.0, scope_info.bindings.len()
                        ));
                        break;
                    }
                }
                if consistency_error.is_some() {
                    break;
                }
                if let Some(parent) = scope.parent {
                    if parent.0 as usize >= scope_info.scopes.len() {
                        consistency_error = Some(format!(
                            "Scope {} has parent {} but only {} scopes exist",
                            scope.id.0, parent.0, scope_info.scopes.len()
                        ));
                        break;
                    }
                }
            }
        }

        if consistency_error.is_none() {
            for (&_offset, &bid) in &scope_info.reference_to_binding {
                if bid.0 as usize >= scope_info.bindings.len() {
                    consistency_error = Some(format!(
                        "reference_to_binding has binding id {} but only {} bindings exist",
                        bid.0, scope_info.bindings.len()
                    ));
                    break;
                }
            }
        }

        if consistency_error.is_none() {
            for (&_offset, &sid) in &scope_info.node_to_scope {
                if sid.0 as usize >= scope_info.scopes.len() {
                    consistency_error = Some(format!(
                        "node_to_scope has scope id {} but only {} scopes exist",
                        sid.0, scope_info.scopes.len()
                    ));
                    break;
                }
            }
        }

        if let Some(err) = consistency_error {
            failures.push((fixture_name, format!("Consistency error: {err}")));
            continue;
        }

        passed += 1;
    }

    println!(
        "\n{passed}/{total} fixtures passed scope info round-trip ({skipped} skipped - no scope.json)"
    );

    if !failures.is_empty() {
        let show_count = failures.len().min(5);
        let mut msg = format!(
            "\n{} of {total} fixtures failed scope info test (showing first {show_count}):\n\n",
            failures.len()
        );
        for (name, err) in failures.iter().take(show_count) {
            msg.push_str(&format!("--- {name} ---\n{err}\n\n"));
        }
        if failures.len() > show_count {
            msg.push_str(&format!(
                "... and {} more failures\n",
                failures.len() - show_count
            ));
        }
        panic!("{msg}");
    }
}

// ============================================================================
// Typed AST traversal for identifier renaming
// ============================================================================

fn enter(start: Option<u32>, si: &ScopeInfo, ss: &mut Vec<u32>) -> bool {
    if let Some(start) = start {
        if let Some(&scope_id) = si.node_to_scope.get(&start) {
            ss.push(scope_id.0);
            return true;
        }
    }
    false
}

fn leave(pushed: bool, ss: &mut Vec<u32>) {
    if pushed {
        ss.pop();
    }
}

fn rename_id(id: &mut Identifier, si: &ScopeInfo, ss: &mut Vec<u32>) {
    if let Some(start) = id.base.start {
        if let Some(&bid) = si.reference_to_binding.get(&start) {
            if let Some(&scope) = ss.last() {
                id.name = format!("{}_s{}_b{}", id.name, scope, bid.0);
            }
        }
    }
    visit_json_opt(&mut id.type_annotation, si, ss);
    if let Some(decorators) = &mut id.decorators {
        visit_json_vec(decorators, si, ss);
    }
}

/// Fallback walker for serde_json::Value fields (class bodies, type annotations, decorators, etc.)
fn visit_json(val: &mut serde_json::Value, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match val {
        serde_json::Value::Object(map) => {
            let pushed = if let Some(start) = map.get("start").and_then(|v| v.as_u64()) {
                if let Some(&scope_id) = si.node_to_scope.get(&(start as u32)) {
                    ss.push(scope_id.0);
                    true
                } else {
                    false
                }
            } else {
                false
            };

            if map.get("type").and_then(|v| v.as_str()) == Some("Identifier") {
                if let Some(start) = map.get("start").and_then(|v| v.as_u64()) {
                    if let Some(&bid) = si.reference_to_binding.get(&(start as u32)) {
                        if let Some(&scope) = ss.last() {
                            if let Some(name) = map
                                .get("name")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string())
                            {
                                map.insert(
                                    "name".to_string(),
                                    serde_json::Value::String(format!(
                                        "{}_s{}_b{}",
                                        name, scope, bid.0
                                    )),
                                );
                            }
                        }
                    }
                }
            }

            let keys: Vec<String> = map.keys().cloned().collect();
            for key in keys {
                if let Some(child) = map.get_mut(&key) {
                    visit_json(child, si, ss);
                }
            }

            leave(pushed, ss);
        }
        serde_json::Value::Array(arr) => {
            for item in arr.iter_mut() {
                visit_json(item, si, ss);
            }
        }
        _ => {}
    }
}

fn visit_json_vec(vals: &mut [serde_json::Value], si: &ScopeInfo, ss: &mut Vec<u32>) {
    for val in vals.iter_mut() {
        visit_json(val, si, ss);
    }
}

fn visit_json_opt(val: &mut Option<Box<serde_json::Value>>, si: &ScopeInfo, ss: &mut Vec<u32>) {
    if let Some(v) = val {
        visit_json(v, si, ss);
    }
}

fn rename_identifiers(file: &mut react_compiler_ast::File, si: &ScopeInfo) {
    let mut ss = Vec::new();
    let p = enter(file.base.start, si, &mut ss);
    visit_program(&mut file.program, si, &mut ss);
    leave(p, &mut ss);
}

fn visit_program(prog: &mut react_compiler_ast::Program, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(prog.base.start, si, ss);
    for stmt in &mut prog.body {
        visit_stmt(stmt, si, ss);
    }
    leave(p, ss);
}

fn visit_block(block: &mut BlockStatement, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(block.base.start, si, ss);
    for stmt in &mut block.body {
        visit_stmt(stmt, si, ss);
    }
    leave(p, ss);
}

fn visit_stmt(stmt: &mut Statement, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match stmt {
        Statement::BlockStatement(s) => visit_block(s, si, ss),
        Statement::ReturnStatement(s) => {
            let p = enter(s.base.start, si, ss);
            if let Some(arg) = &mut s.argument {
                visit_expr(arg, si, ss);
            }
            leave(p, ss);
        }
        Statement::ExpressionStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.expression, si, ss);
            leave(p, ss);
        }
        Statement::IfStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.test, si, ss);
            visit_stmt(&mut s.consequent, si, ss);
            if let Some(alt) = &mut s.alternate {
                visit_stmt(alt, si, ss);
            }
            leave(p, ss);
        }
        Statement::ForStatement(s) => {
            let p = enter(s.base.start, si, ss);
            if let Some(init) = &mut s.init {
                match init.as_mut() {
                    ForInit::VariableDeclaration(d) => visit_var_decl(d, si, ss),
                    ForInit::Expression(e) => visit_expr(e, si, ss),
                }
            }
            if let Some(test) = &mut s.test {
                visit_expr(test, si, ss);
            }
            if let Some(update) = &mut s.update {
                visit_expr(update, si, ss);
            }
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::WhileStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.test, si, ss);
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::DoWhileStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_stmt(&mut s.body, si, ss);
            visit_expr(&mut s.test, si, ss);
            leave(p, ss);
        }
        Statement::ForInStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_for_left(&mut s.left, si, ss);
            visit_expr(&mut s.right, si, ss);
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::ForOfStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_for_left(&mut s.left, si, ss);
            visit_expr(&mut s.right, si, ss);
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::SwitchStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.discriminant, si, ss);
            for case in &mut s.cases {
                if let Some(test) = &mut case.test {
                    visit_expr(test, si, ss);
                }
                for child in &mut case.consequent {
                    visit_stmt(child, si, ss);
                }
            }
            leave(p, ss);
        }
        Statement::ThrowStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.argument, si, ss);
            leave(p, ss);
        }
        Statement::TryStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_block(&mut s.block, si, ss);
            if let Some(handler) = &mut s.handler {
                let hp = enter(handler.base.start, si, ss);
                if let Some(param) = &mut handler.param {
                    visit_pat(param, si, ss);
                }
                visit_block(&mut handler.body, si, ss);
                leave(hp, ss);
            }
            if let Some(fin) = &mut s.finalizer {
                visit_block(fin, si, ss);
            }
            leave(p, ss);
        }
        Statement::LabeledStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::WithStatement(s) => {
            let p = enter(s.base.start, si, ss);
            visit_expr(&mut s.object, si, ss);
            visit_stmt(&mut s.body, si, ss);
            leave(p, ss);
        }
        Statement::VariableDeclaration(d) => visit_var_decl(d, si, ss),
        Statement::FunctionDeclaration(f) => visit_func_decl(f, si, ss),
        Statement::ClassDeclaration(c) => visit_class_decl(c, si, ss),
        Statement::ImportDeclaration(d) => visit_import_decl(d, si, ss),
        Statement::ExportNamedDeclaration(d) => visit_export_named(d, si, ss),
        Statement::ExportDefaultDeclaration(d) => visit_export_default(d, si, ss),
        Statement::TSTypeAliasDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.type_annotation, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Statement::TSInterfaceDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Statement::TSEnumDeclaration(d) => {
            let p = enter(d.base.start, si, ss);
            rename_id(&mut d.id, si, ss);
            visit_json_vec(&mut d.members, si, ss);
            leave(p, ss);
        }
        Statement::TSModuleDeclaration(d) => {
            let p = enter(d.base.start, si, ss);
            visit_json(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            leave(p, ss);
        }
        Statement::TSDeclareFunction(d) => {
            let p = enter(d.base.start, si, ss);
            if let Some(id) = &mut d.id {
                rename_id(id, si, ss);
            }
            visit_json_vec(&mut d.params, si, ss);
            visit_json_opt(&mut d.return_type, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            leave(p, ss);
        }
        Statement::TypeAlias(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.right, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Statement::OpaqueType(d) => {
            rename_id(&mut d.id, si, ss);
            if let Some(st) = &mut d.supertype {
                visit_json(st, si, ss);
            }
            visit_json(&mut d.impltype, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Statement::InterfaceDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Statement::DeclareVariable(d) => rename_id(&mut d.id, si, ss),
        Statement::DeclareFunction(d) => {
            rename_id(&mut d.id, si, ss);
            if let Some(pred) = &mut d.predicate {
                visit_json(pred, si, ss);
            }
        }
        Statement::DeclareClass(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Statement::DeclareModule(d) => {
            visit_json(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
        }
        Statement::DeclareModuleExports(d) => {
            visit_json(&mut d.type_annotation, si, ss);
        }
        Statement::DeclareExportDeclaration(d) => {
            if let Some(decl) = &mut d.declaration {
                visit_json(decl, si, ss);
            }
            if let Some(specs) = &mut d.specifiers {
                visit_json_vec(specs, si, ss);
            }
        }
        Statement::DeclareInterface(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Statement::DeclareTypeAlias(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.right, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Statement::DeclareOpaqueType(d) => {
            rename_id(&mut d.id, si, ss);
            if let Some(st) = &mut d.supertype {
                visit_json(st, si, ss);
            }
            if let Some(impl_) = &mut d.impltype {
                visit_json(impl_, si, ss);
            }
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Statement::EnumDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
        }
        Statement::BreakStatement(_)
        | Statement::ContinueStatement(_)
        | Statement::EmptyStatement(_)
        | Statement::DebuggerStatement(_)
        | Statement::ExportAllDeclaration(_)
        | Statement::DeclareExportAllDeclaration(_) => {}
    }
}

/// Extract the base start offset from any Expression variant.
fn expr_start(expr: &Expression) -> Option<u32> {
    match expr {
        Expression::Identifier(e) => e.base.start,
        Expression::CallExpression(e) => e.base.start,
        Expression::MemberExpression(e) => e.base.start,
        Expression::OptionalCallExpression(e) => e.base.start,
        Expression::OptionalMemberExpression(e) => e.base.start,
        Expression::BinaryExpression(e) => e.base.start,
        Expression::LogicalExpression(e) => e.base.start,
        Expression::UnaryExpression(e) => e.base.start,
        Expression::UpdateExpression(e) => e.base.start,
        Expression::ConditionalExpression(e) => e.base.start,
        Expression::AssignmentExpression(e) => e.base.start,
        Expression::SequenceExpression(e) => e.base.start,
        Expression::ArrowFunctionExpression(e) => e.base.start,
        Expression::FunctionExpression(e) => e.base.start,
        Expression::ObjectExpression(e) => e.base.start,
        Expression::ArrayExpression(e) => e.base.start,
        Expression::NewExpression(e) => e.base.start,
        Expression::TemplateLiteral(e) => e.base.start,
        Expression::TaggedTemplateExpression(e) => e.base.start,
        Expression::AwaitExpression(e) => e.base.start,
        Expression::YieldExpression(e) => e.base.start,
        Expression::SpreadElement(e) => e.base.start,
        Expression::MetaProperty(e) => e.base.start,
        Expression::ClassExpression(e) => e.base.start,
        Expression::PrivateName(e) => e.base.start,
        Expression::Super(e) => e.base.start,
        Expression::Import(e) => e.base.start,
        Expression::ThisExpression(e) => e.base.start,
        Expression::ParenthesizedExpression(e) => e.base.start,
        Expression::AssignmentPattern(e) => e.base.start,
        Expression::TSAsExpression(e) => e.base.start,
        Expression::TSSatisfiesExpression(e) => e.base.start,
        Expression::TSNonNullExpression(e) => e.base.start,
        Expression::TSTypeAssertion(e) => e.base.start,
        Expression::TSInstantiationExpression(e) => e.base.start,
        Expression::TypeCastExpression(e) => e.base.start,
        Expression::JSXElement(e) => e.base.start,
        Expression::JSXFragment(e) => e.base.start,
        Expression::StringLiteral(e) => e.base.start,
        Expression::NumericLiteral(e) => e.base.start,
        Expression::BooleanLiteral(e) => e.base.start,
        Expression::NullLiteral(e) => e.base.start,
        Expression::BigIntLiteral(e) => e.base.start,
        Expression::RegExpLiteral(e) => e.base.start,
    }
}

fn visit_expr(expr: &mut Expression, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(expr_start(expr), si, ss);
    visit_expr_inner(expr, si, ss);
    leave(p, ss);
}

fn visit_expr_inner(expr: &mut Expression, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match expr {
        Expression::Identifier(id) => rename_id(id, si, ss),
        Expression::CallExpression(e) => {
            visit_expr(&mut e.callee, si, ss);
            for arg in &mut e.arguments {
                visit_expr(arg, si, ss);
            }
            visit_json_opt(&mut e.type_parameters, si, ss);
            visit_json_opt(&mut e.type_arguments, si, ss);
        }
        Expression::MemberExpression(e) => {
            visit_expr(&mut e.object, si, ss);
            visit_expr(&mut e.property, si, ss);
        }
        Expression::OptionalCallExpression(e) => {
            visit_expr(&mut e.callee, si, ss);
            for arg in &mut e.arguments {
                visit_expr(arg, si, ss);
            }
            visit_json_opt(&mut e.type_parameters, si, ss);
            visit_json_opt(&mut e.type_arguments, si, ss);
        }
        Expression::OptionalMemberExpression(e) => {
            visit_expr(&mut e.object, si, ss);
            visit_expr(&mut e.property, si, ss);
        }
        Expression::BinaryExpression(e) => {
            visit_expr(&mut e.left, si, ss);
            visit_expr(&mut e.right, si, ss);
        }
        Expression::LogicalExpression(e) => {
            visit_expr(&mut e.left, si, ss);
            visit_expr(&mut e.right, si, ss);
        }
        Expression::UnaryExpression(e) => visit_expr(&mut e.argument, si, ss),
        Expression::UpdateExpression(e) => visit_expr(&mut e.argument, si, ss),
        Expression::ConditionalExpression(e) => {
            visit_expr(&mut e.test, si, ss);
            visit_expr(&mut e.consequent, si, ss);
            visit_expr(&mut e.alternate, si, ss);
        }
        Expression::AssignmentExpression(e) => {
            visit_pat(&mut e.left, si, ss);
            visit_expr(&mut e.right, si, ss);
        }
        Expression::SequenceExpression(e) => {
            for child in &mut e.expressions {
                visit_expr(child, si, ss);
            }
        }
        Expression::ArrowFunctionExpression(e) => {
            if let Some(id) = &mut e.id {
                rename_id(id, si, ss);
            }
            for param in &mut e.params {
                visit_pat(param, si, ss);
            }
            match e.body.as_mut() {
                ArrowFunctionBody::BlockStatement(block) => visit_block(block, si, ss),
                ArrowFunctionBody::Expression(expr) => visit_expr(expr, si, ss),
            }
            visit_json_opt(&mut e.return_type, si, ss);
            visit_json_opt(&mut e.type_parameters, si, ss);
            visit_json_opt(&mut e.predicate, si, ss);
        }
        Expression::FunctionExpression(e) => {
            if let Some(id) = &mut e.id {
                rename_id(id, si, ss);
            }
            for param in &mut e.params {
                visit_pat(param, si, ss);
            }
            visit_block(&mut e.body, si, ss);
            visit_json_opt(&mut e.return_type, si, ss);
            visit_json_opt(&mut e.type_parameters, si, ss);
        }
        Expression::ObjectExpression(e) => {
            for prop in &mut e.properties {
                match prop {
                    ObjectExpressionProperty::ObjectProperty(op) => {
                        let pp = enter(op.base.start, si, ss);
                        visit_expr(&mut op.key, si, ss);
                        visit_expr(&mut op.value, si, ss);
                        leave(pp, ss);
                    }
                    ObjectExpressionProperty::ObjectMethod(m) => {
                        // ObjectMethod has its own base, enter scope for it
                        let mp = enter(m.base.start, si, ss);
                        visit_expr(&mut m.key, si, ss);
                        for param in &mut m.params {
                            visit_pat(param, si, ss);
                        }
                        visit_block(&mut m.body, si, ss);
                        visit_json_opt(&mut m.return_type, si, ss);
                        visit_json_opt(&mut m.type_parameters, si, ss);
                        leave(mp, ss);
                    }
                    ObjectExpressionProperty::SpreadElement(s) => {
                        visit_expr(&mut s.argument, si, ss);
                    }
                }
            }
        }
        Expression::ArrayExpression(e) => {
            for elem in &mut e.elements {
                if let Some(el) = elem {
                    visit_expr(el, si, ss);
                }
            }
        }
        Expression::NewExpression(e) => {
            visit_expr(&mut e.callee, si, ss);
            for arg in &mut e.arguments {
                visit_expr(arg, si, ss);
            }
            visit_json_opt(&mut e.type_parameters, si, ss);
            visit_json_opt(&mut e.type_arguments, si, ss);
        }
        Expression::TemplateLiteral(e) => {
            for child in &mut e.expressions {
                visit_expr(child, si, ss);
            }
        }
        Expression::TaggedTemplateExpression(e) => {
            visit_expr(&mut e.tag, si, ss);
            for child in &mut e.quasi.expressions {
                visit_expr(child, si, ss);
            }
            visit_json_opt(&mut e.type_parameters, si, ss);
        }
        Expression::AwaitExpression(e) => visit_expr(&mut e.argument, si, ss),
        Expression::YieldExpression(e) => {
            if let Some(arg) = &mut e.argument {
                visit_expr(arg, si, ss);
            }
        }
        Expression::SpreadElement(e) => visit_expr(&mut e.argument, si, ss),
        Expression::MetaProperty(e) => {
            // meta and property identifiers are not binding references
            rename_id(&mut e.meta, si, ss);
            rename_id(&mut e.property, si, ss);
        }
        Expression::ClassExpression(e) => {
            if let Some(id) = &mut e.id {
                rename_id(id, si, ss);
            }
            if let Some(sc) = &mut e.super_class {
                visit_expr(sc, si, ss);
            }
            visit_json_vec(&mut e.body.body, si, ss);
            if let Some(dec) = &mut e.decorators {
                visit_json_vec(dec, si, ss);
            }
            visit_json_opt(&mut e.super_type_parameters, si, ss);
            visit_json_opt(&mut e.type_parameters, si, ss);
            if let Some(imp) = &mut e.implements {
                visit_json_vec(imp, si, ss);
            }
        }
        Expression::PrivateName(e) => rename_id(&mut e.id, si, ss),
        Expression::ParenthesizedExpression(e) => visit_expr(&mut e.expression, si, ss),
        Expression::AssignmentPattern(p) => {
            visit_pat(&mut p.left, si, ss);
            visit_expr(&mut p.right, si, ss);
        }
        Expression::TSAsExpression(e) => {
            visit_expr(&mut e.expression, si, ss);
            visit_json(&mut e.type_annotation, si, ss);
        }
        Expression::TSSatisfiesExpression(e) => {
            visit_expr(&mut e.expression, si, ss);
            visit_json(&mut e.type_annotation, si, ss);
        }
        Expression::TSNonNullExpression(e) => visit_expr(&mut e.expression, si, ss),
        Expression::TSTypeAssertion(e) => {
            visit_expr(&mut e.expression, si, ss);
            visit_json(&mut e.type_annotation, si, ss);
        }
        Expression::TSInstantiationExpression(e) => {
            visit_expr(&mut e.expression, si, ss);
            visit_json(&mut e.type_parameters, si, ss);
        }
        Expression::TypeCastExpression(e) => {
            visit_expr(&mut e.expression, si, ss);
            visit_json(&mut e.type_annotation, si, ss);
        }
        Expression::JSXElement(e) => visit_jsx_element(e, si, ss),
        Expression::JSXFragment(f) => {
            for child in &mut f.children {
                visit_jsx_child(child, si, ss);
            }
        }
        Expression::StringLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::BigIntLiteral(_)
        | Expression::RegExpLiteral(_)
        | Expression::Super(_)
        | Expression::Import(_)
        | Expression::ThisExpression(_) => {}
    }
}

fn visit_pat(pat: &mut PatternLike, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match pat {
        PatternLike::Identifier(id) => {
            let p = enter(id.base.start, si, ss);
            rename_id(id, si, ss);
            leave(p, ss);
        }
        PatternLike::ObjectPattern(op) => {
            let p = enter(op.base.start, si, ss);
            for prop in &mut op.properties {
                match prop {
                    ObjectPatternProperty::ObjectProperty(pp) => {
                        let pp_p = enter(pp.base.start, si, ss);
                        visit_expr(&mut pp.key, si, ss);
                        visit_pat(&mut pp.value, si, ss);
                        leave(pp_p, ss);
                    }
                    ObjectPatternProperty::RestElement(r) => {
                        let rp = enter(r.base.start, si, ss);
                        visit_pat(&mut r.argument, si, ss);
                        visit_json_opt(&mut r.type_annotation, si, ss);
                        leave(rp, ss);
                    }
                }
            }
            visit_json_opt(&mut op.type_annotation, si, ss);
            leave(p, ss);
        }
        PatternLike::ArrayPattern(ap) => {
            let p = enter(ap.base.start, si, ss);
            for elem in &mut ap.elements {
                if let Some(el) = elem {
                    visit_pat(el, si, ss);
                }
            }
            visit_json_opt(&mut ap.type_annotation, si, ss);
            leave(p, ss);
        }
        PatternLike::AssignmentPattern(ap) => {
            let p = enter(ap.base.start, si, ss);
            visit_pat(&mut ap.left, si, ss);
            visit_expr(&mut ap.right, si, ss);
            visit_json_opt(&mut ap.type_annotation, si, ss);
            leave(p, ss);
        }
        PatternLike::RestElement(re) => {
            let p = enter(re.base.start, si, ss);
            visit_pat(&mut re.argument, si, ss);
            visit_json_opt(&mut re.type_annotation, si, ss);
            leave(p, ss);
        }
        PatternLike::MemberExpression(e) => {
            let p = enter(e.base.start, si, ss);
            visit_expr(&mut e.object, si, ss);
            visit_expr(&mut e.property, si, ss);
            leave(p, ss);
        }
    }
}

fn visit_for_left(left: &mut Box<ForInOfLeft>, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match left.as_mut() {
        ForInOfLeft::VariableDeclaration(d) => visit_var_decl(d, si, ss),
        ForInOfLeft::Pattern(p) => visit_pat(p, si, ss),
    }
}

fn visit_var_decl(d: &mut VariableDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(d.base.start, si, ss);
    for decl in &mut d.declarations {
        let dp = enter(decl.base.start, si, ss);
        visit_pat(&mut decl.id, si, ss);
        if let Some(init) = &mut decl.init {
            visit_expr(init, si, ss);
        }
        leave(dp, ss);
    }
    leave(p, ss);
}

fn visit_func_decl(f: &mut FunctionDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(f.base.start, si, ss);
    if let Some(id) = &mut f.id {
        rename_id(id, si, ss);
    }
    for param in &mut f.params {
        visit_pat(param, si, ss);
    }
    visit_block(&mut f.body, si, ss);
    visit_json_opt(&mut f.return_type, si, ss);
    visit_json_opt(&mut f.type_parameters, si, ss);
    visit_json_opt(&mut f.predicate, si, ss);
    leave(p, ss);
}

fn visit_class_decl(c: &mut ClassDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(c.base.start, si, ss);
    if let Some(id) = &mut c.id {
        rename_id(id, si, ss);
    }
    if let Some(sc) = &mut c.super_class {
        visit_expr(sc, si, ss);
    }
    visit_json_vec(&mut c.body.body, si, ss);
    if let Some(dec) = &mut c.decorators {
        visit_json_vec(dec, si, ss);
    }
    visit_json_opt(&mut c.super_type_parameters, si, ss);
    visit_json_opt(&mut c.type_parameters, si, ss);
    if let Some(imp) = &mut c.implements {
        visit_json_vec(imp, si, ss);
    }
    leave(p, ss);
}

fn visit_import_decl(d: &mut ImportDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(d.base.start, si, ss);
    for spec in &mut d.specifiers {
        match spec {
            ImportSpecifier::ImportSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                rename_id(&mut s.local, si, ss);
                visit_module_export_name(&mut s.imported, si, ss);
                leave(sp, ss);
            }
            ImportSpecifier::ImportDefaultSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                rename_id(&mut s.local, si, ss);
                leave(sp, ss);
            }
            ImportSpecifier::ImportNamespaceSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                rename_id(&mut s.local, si, ss);
                leave(sp, ss);
            }
        }
    }
    leave(p, ss);
}

fn visit_export_named(d: &mut ExportNamedDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(d.base.start, si, ss);
    if let Some(decl) = &mut d.declaration {
        visit_declaration(decl, si, ss);
    }
    for spec in &mut d.specifiers {
        match spec {
            ExportSpecifier::ExportSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                visit_module_export_name(&mut s.local, si, ss);
                visit_module_export_name(&mut s.exported, si, ss);
                leave(sp, ss);
            }
            ExportSpecifier::ExportDefaultSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                rename_id(&mut s.exported, si, ss);
                leave(sp, ss);
            }
            ExportSpecifier::ExportNamespaceSpecifier(s) => {
                let sp = enter(s.base.start, si, ss);
                visit_module_export_name(&mut s.exported, si, ss);
                leave(sp, ss);
            }
        }
    }
    leave(p, ss);
}

fn visit_export_default(d: &mut ExportDefaultDeclaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    let p = enter(d.base.start, si, ss);
    match d.declaration.as_mut() {
        ExportDefaultDecl::FunctionDeclaration(f) => visit_func_decl(f, si, ss),
        ExportDefaultDecl::ClassDeclaration(c) => visit_class_decl(c, si, ss),
        ExportDefaultDecl::Expression(e) => visit_expr(e, si, ss),
    }
    leave(p, ss);
}

fn visit_declaration(d: &mut Declaration, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match d {
        Declaration::FunctionDeclaration(f) => visit_func_decl(f, si, ss),
        Declaration::ClassDeclaration(c) => visit_class_decl(c, si, ss),
        Declaration::VariableDeclaration(v) => visit_var_decl(v, si, ss),
        Declaration::TSTypeAliasDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.type_annotation, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Declaration::TSInterfaceDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Declaration::TSEnumDeclaration(d) => {
            let p = enter(d.base.start, si, ss);
            rename_id(&mut d.id, si, ss);
            visit_json_vec(&mut d.members, si, ss);
            leave(p, ss);
        }
        Declaration::TSModuleDeclaration(d) => {
            let p = enter(d.base.start, si, ss);
            visit_json(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            leave(p, ss);
        }
        Declaration::TSDeclareFunction(d) => {
            let p = enter(d.base.start, si, ss);
            if let Some(id) = &mut d.id {
                rename_id(id, si, ss);
            }
            visit_json_vec(&mut d.params, si, ss);
            visit_json_opt(&mut d.return_type, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            leave(p, ss);
        }
        Declaration::TypeAlias(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.right, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Declaration::OpaqueType(d) => {
            rename_id(&mut d.id, si, ss);
            if let Some(st) = &mut d.supertype {
                visit_json(st, si, ss);
            }
            visit_json(&mut d.impltype, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
        }
        Declaration::InterfaceDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
            visit_json_opt(&mut d.type_parameters, si, ss);
            if let Some(ext) = &mut d.extends {
                visit_json_vec(ext, si, ss);
            }
        }
        Declaration::EnumDeclaration(d) => {
            rename_id(&mut d.id, si, ss);
            visit_json(&mut d.body, si, ss);
        }
    }
}

fn visit_module_export_name(n: &mut ModuleExportName, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match n {
        ModuleExportName::Identifier(id) => rename_id(id, si, ss),
        ModuleExportName::StringLiteral(_) => {}
    }
}

fn visit_jsx_element(el: &mut JSXElement, si: &ScopeInfo, ss: &mut Vec<u32>) {
    visit_jsx_name(&mut el.opening_element.name, si, ss);
    for attr in &mut el.opening_element.attributes {
        match attr {
            JSXAttributeItem::JSXAttribute(a) => {
                if let Some(val) = &mut a.value {
                    match val {
                        JSXAttributeValue::JSXExpressionContainer(c) => {
                            visit_jsx_expr(&mut c.expression, si, ss);
                        }
                        JSXAttributeValue::JSXElement(e) => visit_jsx_element(e, si, ss),
                        JSXAttributeValue::JSXFragment(f) => {
                            for child in &mut f.children {
                                visit_jsx_child(child, si, ss);
                            }
                        }
                        JSXAttributeValue::StringLiteral(_) => {}
                    }
                }
            }
            JSXAttributeItem::JSXSpreadAttribute(s) => visit_expr(&mut s.argument, si, ss),
        }
    }
    visit_json_opt(&mut el.opening_element.type_parameters, si, ss);
    for child in &mut el.children {
        visit_jsx_child(child, si, ss);
    }
}

fn visit_jsx_child(child: &mut JSXChild, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match child {
        JSXChild::JSXElement(e) => visit_jsx_element(e, si, ss),
        JSXChild::JSXFragment(f) => {
            for child in &mut f.children {
                visit_jsx_child(child, si, ss);
            }
        }
        JSXChild::JSXExpressionContainer(c) => visit_jsx_expr(&mut c.expression, si, ss),
        JSXChild::JSXSpreadChild(s) => visit_expr(&mut s.expression, si, ss),
        JSXChild::JSXText(_) => {}
    }
}

fn visit_jsx_expr(expr: &mut JSXExpressionContainerExpr, si: &ScopeInfo, ss: &mut Vec<u32>) {
    match expr {
        JSXExpressionContainerExpr::Expression(e) => visit_expr(e, si, ss),
        JSXExpressionContainerExpr::JSXEmptyExpression(_) => {}
    }
}

fn visit_jsx_name(name: &mut JSXElementName, si: &ScopeInfo, ss: &mut Vec<u32>) {
    // JSXIdentifiers are not regular Identifiers — they are not in reference_to_binding.
    // But JSXMemberExpression objects could reference bindings via their root JSXIdentifier,
    // and those are also not regular Identifiers. No renaming needed for JSX names.
    let _ = (name, si, ss);
}

#[test]
fn scope_resolution_rename() {
    let json_dir = get_fixture_json_dir();
    let mut failures: Vec<(String, String)> = Vec::new();
    let mut total = 0;
    let mut passed = 0;
    let mut skipped = 0;

    for entry in walkdir::WalkDir::new(&json_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().extension().is_some_and(|ext| ext == "json")
                && !e.path().to_string_lossy().contains(".scope.")
                && !e.path().to_string_lossy().contains(".renamed.")
        })
    {
        let ast_path_str = entry.path().to_string_lossy().to_string();
        let scope_path_str = ast_path_str.replace(".json", ".scope.json");
        let renamed_path_str = ast_path_str.replace(".json", ".renamed.json");
        let scope_path = std::path::Path::new(&scope_path_str);
        let renamed_path = std::path::Path::new(&renamed_path_str);

        if !scope_path.exists() || !renamed_path.exists() {
            skipped += 1;
            continue;
        }

        let fixture_name = entry
            .path()
            .strip_prefix(&json_dir)
            .unwrap()
            .display()
            .to_string();
        total += 1;

        let ast_json = std::fs::read_to_string(entry.path()).unwrap();
        let scope_json = std::fs::read_to_string(scope_path).unwrap();
        let babel_renamed_json = std::fs::read_to_string(renamed_path).unwrap();

        let scope_info: react_compiler_ast::scope::ScopeInfo =
            match serde_json::from_str(&scope_json) {
                Ok(info) => info,
                Err(e) => {
                    failures.push((fixture_name, format!("Scope deserialization error: {e}")));
                    continue;
                }
            };

        // Deserialize into typed AST, rename using scope info, re-serialize
        let mut file: react_compiler_ast::File = match serde_json::from_str(&ast_json) {
            Ok(f) => f,
            Err(e) => {
                failures.push((fixture_name, format!("AST deserialization error: {e}")));
                continue;
            }
        };
        rename_identifiers(&mut file, &scope_info);
        let rust_renamed = serde_json::to_value(&file).unwrap();

        let babel_renamed_value: serde_json::Value =
            serde_json::from_str(&babel_renamed_json).unwrap();

        let rust_normalized = normalize_json(&rust_renamed);
        let babel_normalized = normalize_json(&babel_renamed_value);

        if rust_normalized != babel_normalized {
            let rust_str = serde_json::to_string_pretty(&rust_normalized).unwrap();
            let babel_str = serde_json::to_string_pretty(&babel_normalized).unwrap();
            let diff = compute_diff(&babel_str, &rust_str);
            failures.push((fixture_name, format!("Rename mismatch:\n{diff}")));
        } else {
            passed += 1;
        }
    }

    println!("\n{passed}/{total} fixtures passed scope resolution rename ({skipped} skipped)");

    if !failures.is_empty() {
        let show_count = failures.len().min(5);
        let mut msg = format!(
            "\n{} of {total} fixtures failed scope resolution rename (showing first {show_count}):\n\n",
            failures.len()
        );
        for (name, err) in failures.iter().take(show_count) {
            msg.push_str(&format!("--- {name} ---\n{err}\n\n"));
        }
        if failures.len() > show_count {
            msg.push_str(&format!(
                "... and {} more failures\n",
                failures.len() - show_count
            ));
        }
        panic!("{msg}");
    }
}
