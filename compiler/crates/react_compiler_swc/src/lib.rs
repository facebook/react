// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

pub mod convert_ast;
pub mod convert_ast_reverse;
pub mod convert_scope;
pub mod diagnostics;
pub mod prefilter;

use convert_ast::convert_module;
use convert_ast_reverse::convert_program_to_swc;
use convert_scope::build_scope_info;
use diagnostics::{compile_result_to_diagnostics, DiagnosticMessage};
use prefilter::has_react_like_functions;
use react_compiler::entrypoint::compile_result::LoggerEvent;
use react_compiler::entrypoint::plugin_options::PluginOptions;

/// Result of compiling a program via the SWC frontend.
pub struct TransformResult {
    /// The compiled program as an SWC Module (None if no changes needed).
    pub module: Option<swc_ecma_ast::Module>,
    pub diagnostics: Vec<DiagnosticMessage>,
    pub events: Vec<LoggerEvent>,
}

/// Result of linting a program via the SWC frontend.
pub struct LintResult {
    pub diagnostics: Vec<DiagnosticMessage>,
}

/// Primary transform API — accepts pre-parsed SWC Module.
pub fn transform(
    module: &swc_ecma_ast::Module,
    source_text: &str,
    options: PluginOptions,
) -> TransformResult {
    if options.compilation_mode != "all" && !has_react_like_functions(module) {
        return TransformResult {
            module: None,
            diagnostics: vec![],
            events: vec![],
        };
    }

    let file = convert_module(module, source_text);
    let scope_info = build_scope_info(module);
    let result =
        react_compiler::entrypoint::program::compile_program(file, scope_info, options);

    let diagnostics = compile_result_to_diagnostics(&result);
    let (program_json, events) = match result {
        react_compiler::entrypoint::compile_result::CompileResult::Success {
            ast, events, ..
        } => (ast, events),
        react_compiler::entrypoint::compile_result::CompileResult::Error {
            events, ..
        } => (None, events),
    };

    let swc_module = program_json.and_then(|json| {
        let file: react_compiler_ast::File = serde_json::from_value(json).ok()?;
        Some(convert_program_to_swc(&file))
    });

    TransformResult {
        module: swc_module,
        diagnostics,
        events,
    }
}

/// Convenience wrapper — parses source text, then transforms.
pub fn transform_source(source_text: &str, options: PluginOptions) -> TransformResult {
    let cm = swc_common::sync::Lrc::new(swc_common::SourceMap::default());
    let fm = cm.new_source_file(
        swc_common::sync::Lrc::new(swc_common::FileName::Anon),
        source_text.to_string(),
    );

    let mut errors = vec![];
    let module = swc_ecma_parser::parse_file_as_module(
        &fm,
        swc_ecma_parser::Syntax::Es(swc_ecma_parser::EsSyntax {
            jsx: true,
            ..Default::default()
        }),
        swc_ecma_ast::EsVersion::latest(),
        None,
        &mut errors,
    );

    match module {
        Ok(module) => transform(&module, source_text, options),
        Err(_) => TransformResult {
            module: None,
            diagnostics: vec![],
            events: vec![],
        },
    }
}

/// Lint API — same as transform but only collects diagnostics, no AST output.
pub fn lint(
    module: &swc_ecma_ast::Module,
    source_text: &str,
    options: PluginOptions,
) -> LintResult {
    let mut opts = options;
    opts.no_emit = true;

    let result = transform(module, source_text, opts);
    LintResult {
        diagnostics: result.diagnostics,
    }
}

/// Emit an SWC Module to a string via swc_ecma_codegen.
pub fn emit(module: &swc_ecma_ast::Module) -> String {
    let cm = swc_common::sync::Lrc::new(swc_common::SourceMap::default());
    let mut buf = vec![];
    {
        let wr = swc_ecma_codegen::text_writer::JsWriter::new(
            cm.clone(),
            "\n",
            &mut buf,
            None,
        );
        let mut emitter = swc_ecma_codegen::Emitter {
            cfg: swc_ecma_codegen::Config::default().with_minify(false),
            cm,
            comments: None,
            wr: Box::new(wr),
        };
        swc_ecma_codegen::Node::emit_with(module, &mut emitter).unwrap();
    }
    String::from_utf8(buf).unwrap()
}

/// Convenience wrapper — parses source text, then lints.
pub fn lint_source(source_text: &str, options: PluginOptions) -> LintResult {
    let cm = swc_common::sync::Lrc::new(swc_common::SourceMap::default());
    let fm = cm.new_source_file(
        swc_common::sync::Lrc::new(swc_common::FileName::Anon),
        source_text.to_string(),
    );

    let mut errors = vec![];
    let module = swc_ecma_parser::parse_file_as_module(
        &fm,
        swc_ecma_parser::Syntax::Es(swc_ecma_parser::EsSyntax {
            jsx: true,
            ..Default::default()
        }),
        swc_ecma_ast::EsVersion::latest(),
        None,
        &mut errors,
    );

    match module {
        Ok(module) => lint(&module, source_text, options),
        Err(_) => LintResult {
            diagnostics: vec![],
        },
    }
}
