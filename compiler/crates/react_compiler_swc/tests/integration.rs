// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use swc_common::sync::Lrc;
use swc_common::{FileName, SourceMap};
use swc_ecma_ast::EsVersion;
use swc_ecma_parser::{parse_file_as_module, EsSyntax, Syntax};

use react_compiler_ast::scope::{BindingKind, ScopeKind};
use react_compiler_ast::statements::Statement;
use react_compiler_swc::convert_ast::convert_module;
use react_compiler_swc::convert_ast_reverse::convert_program_to_swc;
use react_compiler_swc::convert_scope::build_scope_info;
use react_compiler_swc::prefilter::has_react_like_functions;
use react_compiler_swc::{lint_source, transform_source};

use react_compiler::entrypoint::plugin_options::{CompilerTarget, PluginOptions};

fn parse_module(source: &str) -> swc_ecma_ast::Module {
    let cm = Lrc::new(SourceMap::default());
    let fm = cm.new_source_file(Lrc::new(FileName::Anon), source.to_string());
    let mut errors = vec![];
    parse_file_as_module(
        &fm,
        Syntax::Es(EsSyntax {
            jsx: true,
            ..Default::default()
        }),
        EsVersion::latest(),
        None,
        &mut errors,
    )
    .expect("Failed to parse")
}

fn default_options() -> PluginOptions {
    PluginOptions {
        should_compile: true,
        enable_reanimated: false,
        is_dev: false,
        filename: None,
        compilation_mode: "infer".to_string(),
        panic_threshold: "none".to_string(),
        target: CompilerTarget::Version("19".to_string()),
        gating: None,
        dynamic_gating: None,
        no_emit: false,
        output_mode: None,
        eslint_suppression_rules: None,
        flow_suppressions: true,
        ignore_use_no_forget: false,
        custom_opt_out_directives: None,
        environment: Default::default(),
    }
}

// ── Prefilter tests ─────────────────────────────────────────────────────────

#[test]
fn prefilter_detects_function_component() {
    let module = parse_module("function MyComponent() { return <div />; }");
    assert!(has_react_like_functions(&module));
}

#[test]
fn prefilter_detects_arrow_component() {
    let module = parse_module("const MyComponent = () => <div />;");
    assert!(has_react_like_functions(&module));
}

#[test]
fn prefilter_detects_hook() {
    let module = parse_module("function useMyHook() { return 42; }");
    assert!(has_react_like_functions(&module));
}

#[test]
fn prefilter_detects_hook_assigned_to_variable() {
    let module = parse_module("const useMyHook = function() { return 42; };");
    assert!(has_react_like_functions(&module));
}

#[test]
fn prefilter_rejects_non_react_module() {
    let module = parse_module(
        r#"
        const x = 1;
        function helper() { return x + 2; }
        export { helper };
        "#,
    );
    assert!(!has_react_like_functions(&module));
}

#[test]
fn prefilter_rejects_lowercase_function() {
    let module = parse_module("function myFunction() { return 42; }");
    assert!(!has_react_like_functions(&module));
}

#[test]
fn prefilter_rejects_use_prefix_without_uppercase() {
    let module = parse_module("function useful() { return true; }");
    assert!(!has_react_like_functions(&module));
}

// ── AST round-trip tests ────────────────────────────────────────────────────

#[test]
fn convert_variable_declaration() {
    let source = "const x = 1;";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::VariableDeclaration(_)
    ));
}

#[test]
fn convert_function_declaration() {
    let source = "function foo() { return 42; }";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::FunctionDeclaration(_)
    ));
}

#[test]
fn convert_arrow_function_expression() {
    let source = "const f = (x) => x + 1;";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::VariableDeclaration(_)
    ));
}

#[test]
fn convert_jsx_element() {
    let source = "const el = <div className=\"test\">hello</div>;";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::VariableDeclaration(_)
    ));
}

#[test]
fn convert_import_declaration() {
    let source = "import { useState } from 'react';";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::ImportDeclaration(_)
    ));
}

#[test]
fn convert_export_named_declaration() {
    let source = "export const x = 1;";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::ExportNamedDeclaration(_)
    ));
}

#[test]
fn convert_export_default_declaration() {
    let source = "export default function App() { return <div />; }";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 1);
    assert!(matches!(
        &file.program.body[0],
        Statement::ExportDefaultDeclaration(_)
    ));
}

#[test]
fn convert_multiple_statements() {
    let source = r#"
        import React from 'react';
        const x = 1;
        function App() { return <div>{x}</div>; }
        export default App;
    "#;
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.body.len(), 4);
    assert!(matches!(
        &file.program.body[0],
        Statement::ImportDeclaration(_)
    ));
    assert!(matches!(
        &file.program.body[1],
        Statement::VariableDeclaration(_)
    ));
    assert!(matches!(
        &file.program.body[2],
        Statement::FunctionDeclaration(_)
    ));
    assert!(matches!(
        &file.program.body[3],
        Statement::ExportDefaultDeclaration(_)
    ));
}

#[test]
fn convert_directive() {
    let source = "'use strict';\nconst x = 1;";
    let module = parse_module(source);
    let file = convert_module(&module, source);
    assert_eq!(file.program.directives.len(), 1);
    assert_eq!(file.program.body.len(), 1);
}

// ── Scope analysis tests ────────────────────────────────────────────────────

#[test]
fn scope_program_scope_created() {
    let source = "const x = 1;";
    let module = parse_module(source);
    let info = build_scope_info(&module);
    assert!(!info.scopes.is_empty());
    assert!(matches!(info.scopes[0].kind, ScopeKind::Program));
    assert!(info.scopes[0].parent.is_none());
}

#[test]
fn scope_var_hoists_to_function() {
    let source = r#"
        function foo() {
            {
                var x = 1;
            }
        }
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    // Find the binding for x
    let x_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "x")
        .expect("should find binding x");
    assert!(matches!(x_binding.kind, BindingKind::Var));

    // x should be in a Function scope, not the Block scope
    let scope = &info.scopes[x_binding.scope.0 as usize];
    assert!(matches!(scope.kind, ScopeKind::Function));
}

#[test]
fn scope_let_const_block_scoped() {
    let source = r#"
        function foo() {
            {
                let x = 1;
                const y = 2;
            }
        }
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let x_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "x")
        .expect("should find binding x");
    assert!(matches!(x_binding.kind, BindingKind::Let));
    let x_scope = &info.scopes[x_binding.scope.0 as usize];
    assert!(matches!(x_scope.kind, ScopeKind::Block));

    let y_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "y")
        .expect("should find binding y");
    assert!(matches!(y_binding.kind, BindingKind::Const));
    let y_scope = &info.scopes[y_binding.scope.0 as usize];
    assert!(matches!(y_scope.kind, ScopeKind::Block));
}

#[test]
fn scope_function_declaration_hoists() {
    let source = r#"
        function outer() {
            {
                function inner() {}
            }
        }
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let inner_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "inner")
        .expect("should find binding inner");
    assert!(matches!(inner_binding.kind, BindingKind::Hoisted));
    // inner should be hoisted to the enclosing function scope (outer), not the block
    let scope = &info.scopes[inner_binding.scope.0 as usize];
    assert!(matches!(scope.kind, ScopeKind::Function));
}

#[test]
fn scope_import_bindings() {
    let source = r#"
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as Utils from './utils';
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let react_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "React")
        .expect("should find binding React");
    assert!(matches!(react_binding.kind, BindingKind::Module));
    assert!(react_binding.import.is_some());
    let import_data = react_binding.import.as_ref().unwrap();
    assert_eq!(import_data.source, "react");

    let use_state_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "useState")
        .expect("should find binding useState");
    assert!(matches!(use_state_binding.kind, BindingKind::Module));

    let utils_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "Utils")
        .expect("should find binding Utils");
    assert!(matches!(utils_binding.kind, BindingKind::Module));
}

#[test]
fn scope_nested_functions_create_scopes() {
    let source = r#"
        function outer(a) {
            function inner(b) {
                return a + b;
            }
        }
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let a_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "a")
        .expect("should find binding a");
    assert!(matches!(a_binding.kind, BindingKind::Param));

    let b_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "b")
        .expect("should find binding b");
    assert!(matches!(b_binding.kind, BindingKind::Param));

    // a and b should be in different function scopes
    assert!(a_binding.scope.0 != b_binding.scope.0);
}

#[test]
fn scope_catch_clause_creates_scope() {
    let source = r#"
        try {
            throw new Error();
        } catch (e) {
            console.log(e);
        }
    "#;
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let e_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "e")
        .expect("should find binding e");
    assert!(matches!(e_binding.kind, BindingKind::Let));
    let scope = &info.scopes[e_binding.scope.0 as usize];
    assert!(matches!(scope.kind, ScopeKind::Catch));
}

#[test]
fn scope_arrow_function_params() {
    let source = "const f = (x, y) => x + y;";
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let x_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "x")
        .expect("should find binding x");
    assert!(matches!(x_binding.kind, BindingKind::Param));
    let scope = &info.scopes[x_binding.scope.0 as usize];
    assert!(matches!(scope.kind, ScopeKind::Function));
}

#[test]
fn scope_for_loop_creates_scope() {
    let source = "for (let i = 0; i < 10; i++) { console.log(i); }";
    let module = parse_module(source);
    let info = build_scope_info(&module);

    let i_binding = info
        .bindings
        .iter()
        .find(|b| b.name == "i")
        .expect("should find binding i");
    assert!(matches!(i_binding.kind, BindingKind::Let));
    let scope = &info.scopes[i_binding.scope.0 as usize];
    assert!(matches!(scope.kind, ScopeKind::For));
}

// ── Full transform pipeline tests ───────────────────────────────────────────

#[test]
fn transform_simple_component_does_not_panic() {
    let source = r#"
        function App() {
            return <div>Hello</div>;
        }
    "#;
    let result = transform_source(source, default_options());
    // The transform should complete without panicking.
    // It may or may not produce output depending on compiler completeness.
    let _ = result.module;
    let _ = result.diagnostics;
}

#[test]
fn transform_component_with_hook_does_not_panic() {
    let source = r#"
        import { useState } from 'react';
        function Counter() {
            const [count, setCount] = useState(0);
            return <div>{count}</div>;
        }
    "#;
    let result = transform_source(source, default_options());
    let _ = result.module;
    let _ = result.diagnostics;
}

#[test]
fn transform_non_react_code_returns_none() {
    let source = "const x = 1 + 2;";
    let result = transform_source(source, default_options());
    // Non-React code with compilation_mode "infer" should be skipped (prefilter)
    assert!(result.module.is_none());
    assert!(result.diagnostics.is_empty());
}

#[test]
fn transform_compilation_mode_all_does_not_skip() {
    let source = "const x = 1 + 2;";
    let mut options = default_options();
    options.compilation_mode = "all".to_string();
    let result = transform_source(source, options);
    // With "all" mode, even non-React code should go through the compiler.
    // It may not produce output, but it should not be skipped by prefilter.
    let _ = result.module;
}

#[test]
fn lint_simple_component_does_not_panic() {
    let source = r#"
        function App() {
            return <div>Hello</div>;
        }
    "#;
    let result = lint_source(source, default_options());
    let _ = result.diagnostics;
}

#[test]
fn lint_non_react_code_returns_empty() {
    let source = "const x = 1;";
    let result = lint_source(source, default_options());
    assert!(result.diagnostics.is_empty());
}

// ── Reverse AST conversion tests ────────────────────────────────────────────

#[test]
fn reverse_convert_variable_declaration() {
    let source = "const x = 1;";
    let module = parse_module(source);
    let file = convert_module(&module, source);

    let swc_module = convert_program_to_swc(&file);
    assert_eq!(swc_module.body.len(), 1);
    assert!(matches!(
        &swc_module.body[0],
        swc_ecma_ast::ModuleItem::Stmt(swc_ecma_ast::Stmt::Decl(swc_ecma_ast::Decl::Var(_)))
    ));
}

#[test]
fn reverse_convert_function_declaration() {
    let source = "function foo() { return 42; }";
    let module = parse_module(source);
    let file = convert_module(&module, source);

    let swc_module = convert_program_to_swc(&file);
    assert_eq!(swc_module.body.len(), 1);
    assert!(matches!(
        &swc_module.body[0],
        swc_ecma_ast::ModuleItem::Stmt(swc_ecma_ast::Stmt::Decl(swc_ecma_ast::Decl::Fn(_)))
    ));
}

#[test]
fn reverse_convert_import_export() {
    let source = r#"
        import { useState } from 'react';
        export const x = 1;
    "#;
    let module = parse_module(source);
    let file = convert_module(&module, source);

    let swc_module = convert_program_to_swc(&file);
    assert_eq!(swc_module.body.len(), 2);
}

#[test]
fn reverse_convert_roundtrip_via_json() {
    let source = r#"
        const x = 1;
        function foo(a, b) { return a + b; }
    "#;
    let module = parse_module(source);
    let file = convert_module(&module, source);

    // Serialize to JSON and deserialize back
    let json = serde_json::to_value(&file).expect("serialize to JSON");
    let deserialized: react_compiler_ast::File =
        serde_json::from_value(json).expect("deserialize from JSON");

    // Convert the deserialized AST back to SWC
    let swc_module = convert_program_to_swc(&deserialized);
    assert_eq!(swc_module.body.len(), 2);
}

#[test]
fn reverse_convert_jsx_roundtrip() {
    let source = r#"const el = <div className="test">hello</div>;"#;
    let module = parse_module(source);
    let file = convert_module(&module, source);

    let json = serde_json::to_value(&file).expect("serialize to JSON");
    let deserialized: react_compiler_ast::File =
        serde_json::from_value(json).expect("deserialize from JSON");

    let swc_module = convert_program_to_swc(&deserialized);
    assert_eq!(swc_module.body.len(), 1);
}

#[test]
fn reverse_convert_multiple_statement_types() {
    let source = r#"
        import React from 'react';
        const x = 1;
        let y = 'hello';
        function App() { return <div>{x}{y}</div>; }
        export default App;
    "#;
    let module = parse_module(source);
    let file = convert_module(&module, source);

    let swc_module = convert_program_to_swc(&file);
    assert_eq!(swc_module.body.len(), 5);
}
