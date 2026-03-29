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
use std::cell::RefCell;
use swc_common::comments::Comments;

thread_local! {
    /// Thread-local storage for comments from the last compilation.
    /// Used by `emit` to include comments without API changes.
    static LAST_COMMENTS: RefCell<Option<swc_common::comments::SingleThreadedComments>> = RefCell::new(None);
}

/// Result of compiling a program via the SWC frontend.
pub struct TransformResult {
    /// The compiled program as an SWC Module (None if no changes needed).
    pub module: Option<swc_ecma_ast::Module>,
    /// Comments extracted from the compiled AST (for use with `emit_with_comments`).
    pub comments: Option<swc_common::comments::SingleThreadedComments>,
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
            comments: None,
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

    let conversion_result = program_json.and_then(|raw_json| {
        // First parse to serde_json::Value which deduplicates "type" fields
        // (the compiler output can produce duplicate "type" keys due to
        // BaseNode.node_type + #[serde(tag = "type")] enum tagging)
        let value: serde_json::Value = serde_json::from_str(raw_json.get()).ok()?;
        let file: react_compiler_ast::File = serde_json::from_value(value).ok()?;
        let result = convert_program_to_swc(&file);
        Some(result)
    });

    let (mut swc_module, mut comments) = match conversion_result {
        Some(result) => (Some(result.module), Some(result.comments)),
        None => (None, None),
    };

    // If we have a compiled module, extract comments from the original source
    // and merge them into the comment map. The Rust compiler does not preserve
    // comments in its output, so we re-extract them from the source text.
    if let Some(ref mut swc_mod) = swc_module {
        use swc_common::Spanned;

        // Fix up dummy spans on compiler-generated items: SWC codegen skips
        // comments at BytePos(0) (DUMMY), so we give generated items a real
        // span derived from the original module's first item.
        let has_source_items = !module.body.is_empty();
        if has_source_items {
            // Use a synthetic span at position 1 (minimal non-dummy position)
            // This ensures comments can be attached to the first item.
            let synthetic_span = swc_common::Span::new(
                swc_common::BytePos(1),
                swc_common::BytePos(1),
            );
            for item in &mut swc_mod.body {
                if item.span().lo.is_dummy() {
                    match item {
                        swc_ecma_ast::ModuleItem::ModuleDecl(
                            swc_ecma_ast::ModuleDecl::Import(import),
                        ) => {
                            import.span = synthetic_span;
                        }
                        swc_ecma_ast::ModuleItem::Stmt(
                            swc_ecma_ast::Stmt::Decl(swc_ecma_ast::Decl::Var(var)),
                        ) => {
                            var.span = synthetic_span;
                        }
                        _ => {}
                    }
                }
            }
        }

        let source_comments = extract_source_comments(source_text);
        if !source_comments.is_empty() {
            let merged = comments.unwrap_or_default();

            for (orig_pos, comment_list) in source_comments {
                // Keep comments at their original positions. Comments
                // attached to the first source statement will appear before
                // the corresponding statement in the compiled output
                // (which preserves the original import's span).
                merged.add_leading_comments(orig_pos, comment_list);
            }
            comments = Some(merged);
        }
    }

    // Store comments in thread-local for `emit` to use
    LAST_COMMENTS.with(|cell| {
        *cell.borrow_mut() = comments.clone();
    });

    TransformResult {
        module: swc_module,
        comments,
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
            comments: None,
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
/// If `transform` was called on the same thread, any comments from the
/// compiled AST are automatically included.
pub fn emit(module: &swc_ecma_ast::Module) -> String {
    LAST_COMMENTS.with(|cell| {
        let borrowed = cell.borrow();
        emit_with_comments(module, borrowed.as_ref())
    })
}

/// Emit an SWC Module to a string, optionally including comments.
pub fn emit_with_comments(
    module: &swc_ecma_ast::Module,
    comments: Option<&swc_common::comments::SingleThreadedComments>,
) -> String {
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
            comments: comments.map(|c| c as &dyn swc_common::comments::Comments),
            wr: Box::new(wr),
        };
        swc_ecma_codegen::Node::emit_with(module, &mut emitter).unwrap();
    }
    let code = String::from_utf8(buf).unwrap();

    // SWC codegen puts block comment endings `*/` and the next code on the
    // same line (e.g., `*/ function foo()`). Insert a newline after `*/`
    // when it's followed by non-whitespace on the same line, to match
    // Babel's behavior.
    fix_block_comment_newlines(&code)
}

/// Insert newlines after `*/` when followed by code on the same line.
/// Only applies to multiline block comments (JSDoc-style), not inline ones.
fn fix_block_comment_newlines(code: &str) -> String {
    let mut result = String::with_capacity(code.len());
    let mut chars = code.char_indices().peekable();
    let bytes = code.as_bytes();
    let mut in_block_comment = false;
    let mut block_comment_multiline = false;

    while let Some((i, c)) = chars.next() {
        // Track block comment state
        if !in_block_comment && c == '/' && bytes.get(i + 1) == Some(&b'*') {
            in_block_comment = true;
            block_comment_multiline = false;
            result.push(c);
            continue;
        }

        if in_block_comment {
            if c == '\n' {
                block_comment_multiline = true;
            }
            result.push(c);

            // Check for end of block comment
            if c == '*' && bytes.get(i + 1) == Some(&b'/') {
                chars.next();
                result.push('/');
                in_block_comment = false;

                if block_comment_multiline {
                    // Skip spaces after `*/`
                    let mut spaces = String::new();
                    while let Some(&(_, next_c)) = chars.peek() {
                        if next_c == ' ' || next_c == '\t' {
                            spaces.push(next_c);
                            chars.next();
                        } else {
                            break;
                        }
                    }

                    // If followed by code on the same line, insert newline
                    if let Some(&(_, next_c)) = chars.peek() {
                        if next_c != '\n' && next_c != '\r' {
                            result.push('\n');
                        } else {
                            result.push_str(&spaces);
                        }
                    } else {
                        result.push_str(&spaces);
                    }
                }
            }
            continue;
        }

        result.push(c);
    }
    result
}

/// Extract comments from source text using SWC's parser.
/// Returns a list of (BytePos, Vec<Comment>) pairs where the BytePos is the
/// position of the token following the comment(s).
fn extract_source_comments(
    source_text: &str,
) -> Vec<(swc_common::BytePos, Vec<swc_common::comments::Comment>)> {
    let cm = swc_common::sync::Lrc::new(swc_common::SourceMap::default());
    let fm = cm.new_source_file(
        swc_common::sync::Lrc::new(swc_common::FileName::Anon),
        source_text.to_string(),
    );

    let comments = swc_common::comments::SingleThreadedComments::default();
    let mut errors = vec![];
    // Try parsing as JSX+TS to handle maximum syntax variety
    let _ = swc_ecma_parser::parse_file_as_module(
        &fm,
        swc_ecma_parser::Syntax::Typescript(swc_ecma_parser::TsSyntax {
            tsx: true,
            ..Default::default()
        }),
        swc_ecma_ast::EsVersion::latest(),
        Some(&comments),
        &mut errors,
    );

    // Collect all leading comments
    let mut result = Vec::new();
    let (leading, _trailing) = comments.borrow_all();
    for (pos, cmts) in leading.iter() {
        if !cmts.is_empty() {
            result.push((*pos, cmts.clone()));
        }
    }

    result
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
