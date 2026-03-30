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

/// Describes where a blank line should be inserted relative to a body item.
#[derive(Clone, Debug)]
pub enum BlankLinePosition {
    /// Insert blank line before the item (including its leading comments).
    /// The `first_code_line` is the item's first code line (without comments)
    /// used as a search anchor in the output.
    BeforeItem { first_code_line: String },
    /// Insert blank line between the item's leading comments and its code.
    /// The `first_code_line` is used to find where the code starts.
    BeforeCode { first_code_line: String },
}

thread_local! {
    /// Thread-local storage for comments from the last compilation.
    /// Used by `emit` to include comments without API changes.
    static LAST_COMMENTS: RefCell<Option<swc_common::comments::SingleThreadedComments>> = RefCell::new(None);

    /// Thread-local storage for blank line positions.
    /// Contains information about where to insert blank lines during emit.
    static BLANK_LINE_POSITIONS: RefCell<Vec<BlankLinePosition>> = RefCell::new(Vec::new());
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

        // Compute blank line positions BEFORE span fixup, while spans still
        // reflect original source positions. Babel's generator adds blank
        // lines between consecutive items when the original source had blank
        // lines between them (i.e., endLine(prev) + 1 < startLine(next)).
        let blank_line_positions =
            compute_blank_line_positions(&swc_mod.body, source_text);

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

        // Store blank line positions in thread-local for `emit` to use
        BLANK_LINE_POSITIONS.with(|cell| {
            *cell.borrow_mut() = blank_line_positions;
        });
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
        let positions = BLANK_LINE_POSITIONS.with(|bl| bl.borrow().clone());
        emit_with_comments(module, borrowed.as_ref(), &positions)
    })
}

/// Emit an SWC Module to a string, optionally including comments.
/// `blank_line_positions` describes where blank lines should be inserted
/// to match Babel's blank line behavior.
pub fn emit_with_comments(
    module: &swc_ecma_ast::Module,
    comments: Option<&swc_common::comments::SingleThreadedComments>,
    blank_line_positions: &[BlankLinePosition],
) -> String {
    // Standard emit path
    let code = emit_module_to_string(module, comments);
    let code = fix_block_comment_newlines(&code);

    // Reposition blank lines that SWC places before comment blocks:
    // SWC emits blank lines before leading comments, but Babel places
    // them after the comments (between comments and the declaration).
    // Move blank lines from before comment blocks to after them when
    // the comment block is followed by a top-level declaration.
    let code = reposition_comment_blank_lines(&code);

    if blank_line_positions.is_empty() || module.body.is_empty() {
        return code;
    }

    // Insert blank lines between top-level declarations to match Babel's
    // output. Babel's generator preserves blank lines from the original
    // source between consecutive top-level items.
    insert_blank_lines_in_output(&code, blank_line_positions)
}

/// Emit a full module to a string.
fn emit_module_to_string(
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
    String::from_utf8(buf).unwrap()
}

/// Insert blank lines into the emitted output at positions specified by
/// `blank_line_positions`. Each position includes a `first_code_line` that
/// identifies the item's first line of code (without comments), used as
/// a search anchor in the output.
fn insert_blank_lines_in_output(
    code: &str,
    positions: &[BlankLinePosition],
) -> String {
    if positions.is_empty() {
        return code.to_string();
    }

    let lines: Vec<&str> = code.lines().collect();

    // Phase 1: Find which output line indices need a blank line inserted
    // BEFORE them. We do this by finding each target's first_code_line in
    // the output, then computing the actual insert line.
    let mut insert_before: Vec<usize> = Vec::new();
    let mut used_lines: Vec<bool> = vec![false; lines.len()];

    for pos in positions {
        let (first_code_line, before_comments) = match pos {
            BlankLinePosition::BeforeItem { first_code_line } => {
                (first_code_line.as_str(), true)
            }
            BlankLinePosition::BeforeCode { first_code_line } => {
                (first_code_line.as_str(), false)
            }
        };

        // Find this code line in the output (first unused match).
        // For BeforeCode positions, also allow matching already-used lines
        // since BeforeItem and BeforeCode may target the same code line.
        let mut found_idx = None;
        for (i, &line) in lines.iter().enumerate() {
            if line == first_code_line && (!used_lines[i] || !before_comments) {
                found_idx = Some(i);
                if !used_lines[i] {
                    used_lines[i] = true;
                }
                break;
            }
        }

        let code_line_idx = match found_idx {
            Some(idx) => idx,
            None => continue,
        };

        let insert_line = if before_comments {
            // BeforeItem: insert before the comment block that precedes
            // this code line
            find_comment_block_start(&lines, code_line_idx)
        } else {
            // BeforeCode: insert right before the code line itself
            code_line_idx
        };

        // Only insert if the previous line is not already blank
        if insert_line > 0 && !lines[insert_line - 1].trim().is_empty() {
            insert_before.push(insert_line);
        }
    }

    if insert_before.is_empty() {
        return code.to_string();
    }

    insert_before.sort_unstable();
    insert_before.dedup();

    // Phase 2: Build the result with blank lines inserted
    let mut result = String::with_capacity(code.len() + insert_before.len() * 2);
    let mut insert_idx = 0;

    for (line_idx, &line) in lines.iter().enumerate() {
        // Check if we need to insert a blank line before this line
        if insert_idx < insert_before.len() && insert_before[insert_idx] == line_idx {
            result.push('\n');
            insert_idx += 1;
        }

        result.push_str(line);
        if line_idx < lines.len() - 1 || code.ends_with('\n') {
            result.push('\n');
        }
    }

    result
}

/// Find the start of a comment block that precedes the line at `code_line_idx`.
/// Walks backwards from `code_line_idx - 1` as long as lines are comment
/// lines (starting with `//`, `/*`, ` *`, `*/`, or `/**`).
fn find_comment_block_start(lines: &[&str], code_line_idx: usize) -> usize {
    let mut start = code_line_idx;
    let mut i = code_line_idx;
    while i > 0 {
        i -= 1;
        let trimmed = lines[i].trim();
        if trimmed.is_empty() {
            break; // blank line, stop
        }
        if trimmed.starts_with("//")
            || trimmed.starts_with("/*")
            || trimmed.starts_with("* ")
            || trimmed.starts_with("*/")
            || trimmed == "*"
        {
            start = i;
        } else {
            break;
        }
    }
    start
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

/// Reposition blank lines from before comment blocks to after them.
///
/// SWC's codegen sometimes places blank lines before leading comment blocks,
/// but Babel's generator places them after the comments (between the comment
/// block and the declaration). This function detects the pattern:
///
///   <non-comment line>
///   <blank line>
///   <comment lines...>
///   <declaration line>
///
/// And transforms it to:
///
///   <non-comment line>
///   <comment lines...>
///   <blank line>
///   <declaration line>
///
/// This only applies to top-level (non-indented) comment blocks.
fn reposition_comment_blank_lines(code: &str) -> String {
    let lines: Vec<&str> = code.lines().collect();
    if lines.len() < 3 {
        return code.to_string();
    }

    let mut result: Vec<&str> = Vec::with_capacity(lines.len());
    let mut i = 0;

    while i < lines.len() {
        // Look for pattern: blank line followed by comment block followed by declaration
        if lines[i].trim().is_empty() && i + 1 < lines.len() {
            let comment_start = i + 1;
            let first_comment = lines[comment_start].trim();

            // Check if the next line is a top-level comment (not indented)
            let is_top_level_comment = (first_comment.starts_with("//")
                || first_comment.starts_with("/*")
                || first_comment.starts_with("/**"))
                && !lines[comment_start].starts_with(' ')
                && !lines[comment_start].starts_with('\t');

            if is_top_level_comment {
                // Find the end of the comment block
                let mut comment_end = comment_start;
                while comment_end < lines.len() {
                    let trimmed = lines[comment_end].trim();
                    if trimmed.starts_with("//")
                        || trimmed.starts_with("/*")
                        || trimmed.starts_with("* ")
                        || trimmed.starts_with("*/")
                        || trimmed == "*"
                        || trimmed.starts_with("/**")
                    {
                        comment_end += 1;
                    } else {
                        break;
                    }
                }

                // Check if the line after the comment block is a non-blank
                // declaration (function, export, class, etc.)
                if comment_end < lines.len() && comment_end > comment_start {
                    let after_comment = lines[comment_end].trim();
                    let is_declaration = !after_comment.is_empty()
                        && !after_comment.starts_with("//")
                        && !after_comment.starts_with("/*");

                    if is_declaration {
                        // Also check that the line before the blank line is
                        // non-empty (end of import or end of function)
                        let prev_non_empty = i > 0 && !lines[i - 1].trim().is_empty();

                        if prev_non_empty {
                            // Move the blank line: emit comment block first,
                            // then blank line, then continue
                            for j in comment_start..comment_end {
                                result.push(lines[j]);
                            }
                            result.push(""); // blank line after comments
                            i = comment_end;
                            continue;
                        }
                    }
                }
            }
        }

        result.push(lines[i]);
        i += 1;
    }

    // Rejoin, preserving trailing newline if present
    let mut output = result.join("\n");
    if code.ends_with('\n') && !output.ends_with('\n') {
        output.push('\n');
    }
    output
}

/// Compute where blank lines should be inserted in the emitted output.
///
/// This replicates Babel's `@babel/generator` behavior: when consecutive
/// top-level items had blank lines between them in the original source,
/// the generator preserves those blank lines.
///
/// We check the item spans (byte positions into the original source) and
/// determine if there was a blank line gap between consecutive items.
/// We also determine WHERE the blank line should go: before the item's
/// leading comments (BeforeItem) or between the comments and code (BeforeCode).
fn compute_blank_line_positions(
    body: &[swc_ecma_ast::ModuleItem],
    source_text: &str,
) -> Vec<BlankLinePosition> {
    use swc_common::Spanned;

    let mut result = Vec::new();

    // Check for blank lines between leading comments and the first
    // non-DUMMY item. This handles the case where comments from the
    // source (e.g., pragma comments) are attached as leading comments
    // to an import, with a blank line gap in the original source.
    for item in body {
        let lo = item.span().lo;
        if lo.is_dummy() {
            continue;
        }
        let lo_u = (lo.0 as usize).saturating_sub(1);
        if lo_u > source_text.len() || lo_u == 0 {
            break;
        }
        // Check the source text before this item for comments followed by blank lines
        let before = &source_text[..lo_u];
        if has_blank_line(before) && (before.contains("//") || before.contains("/*")) {
            // There are comments and blank lines before this item.
            // Check if the blank line is between the comments and this item
            // (i.e., "BeforeCode" pattern)
            if !is_blank_line_before_comments(before) {
                let first_code_line = get_first_code_line(item);
                result.push(BlankLinePosition::BeforeCode { first_code_line });
            }
        }
        break; // Only check the first non-DUMMY item
    }

    for i in 1..body.len() {
        let prev = &body[i - 1];
        let curr = &body[i];

        let prev_hi = prev.span().hi;
        let curr_lo = curr.span().lo;

        // Skip items with dummy/synthetic spans (BytePos(0))
        if prev_hi.is_dummy() || curr_lo.is_dummy() {
            continue;
        }

        // SWC BytePos is 1-based (BytePos(0) is DUMMY/reserved). Convert
        // to 0-based source text indices by subtracting 1.
        let prev_hi_u = (prev_hi.0 as usize).saturating_sub(1);
        let curr_lo_u = (curr_lo.0 as usize).saturating_sub(1);

        if prev_hi_u >= curr_lo_u || prev_hi_u > source_text.len() || curr_lo_u > source_text.len() {
            continue;
        }

        // Check the text between the two items for blank lines.
        // Babel's generator preserves blank lines from the original source
        // between consecutive top-level items.
        let between = &source_text[prev_hi_u..curr_lo_u];
        if !has_blank_line(between) {
            continue;
        }

        // Only preserve blank lines when there are comments between the
        // items. This matches Babel's behavior: the TS compiler's
        // replaceWith() creates fresh nodes without position info, so
        // Babel's generator only sees position gaps when comments with
        // original positions are present between items. Without comments,
        // the generated code and the next item end up close together,
        // so Babel sees no gap and doesn't insert a blank line.
        if !between.contains("//") && !between.contains("/*") {
            continue;
        }

        // Determine the first code line of the current item (emitted
        // without comments) for use as a search anchor.
        let first_code_line = get_first_code_line(curr);

        // Determine whether blank lines exist before and/or after comments.
        let (blank_before, blank_after) = blank_line_positions_around_comments(between);

        if blank_before && blank_after {
            // Both: add blank lines before AND after comments
            result.push(BlankLinePosition::BeforeItem { first_code_line: first_code_line.clone() });
            result.push(BlankLinePosition::BeforeCode { first_code_line });
        } else if blank_after {
            result.push(BlankLinePosition::BeforeCode { first_code_line });
        } else {
            // blank_before only, or no specific position → default to BeforeItem
            result.push(BlankLinePosition::BeforeItem { first_code_line });
        }
    }

    result
}

/// Check if a string contains a blank line (two consecutive newlines
/// with only whitespace between them).
fn has_blank_line(s: &str) -> bool {
    let mut prev_newline = false;
    for c in s.chars() {
        if c == '\n' {
            if prev_newline {
                return true;
            }
            prev_newline = true;
        } else if c == ' ' || c == '\t' || c == '\r' {
            // whitespace between newlines is ok
        } else {
            prev_newline = false;
        }
    }
    false
}

/// Determine where blank lines exist relative to comments in the between-text.
///
/// Returns (blank_before_comments, blank_after_comments):
/// - blank_before: there's a blank line before any comment content
/// - blank_after: there's a blank line after comment content
fn blank_line_positions_around_comments(between: &str) -> (bool, bool) {
    let mut found_comment = false;
    let mut prev_newline = false;
    let mut blank_before = false;
    let mut blank_after = false;

    for (i, c) in between.char_indices() {
        if c == '\n' {
            if prev_newline {
                if found_comment {
                    blank_after = true;
                } else {
                    blank_before = true;
                }
            }
            prev_newline = true;
        } else if c == ' ' || c == '\t' || c == '\r' {
            // whitespace between newlines is ok
        } else {
            prev_newline = false;
            if c == '/' {
                let next = between.as_bytes().get(i + 1);
                if next == Some(&b'*') || next == Some(&b'/') {
                    found_comment = true;
                }
            }
        }
    }

    (blank_before, blank_after)
}

/// Check if the blank line in the between-text should be placed before
/// comments. Used for the first-item leading comment check.
fn is_blank_line_before_comments(between: &str) -> bool {
    let (blank_before, blank_after) = blank_line_positions_around_comments(between);
    // If blank lines exist after comments, prefer BeforeCode (return false)
    if blank_after {
        return false;
    }
    blank_before
}

/// Get the first non-empty line of a ModuleItem when emitted without comments.
fn get_first_code_line(item: &swc_ecma_ast::ModuleItem) -> String {
    let single_module = swc_ecma_ast::Module {
        span: swc_common::DUMMY_SP,
        body: vec![item.clone()],
        shebang: None,
    };

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
        swc_ecma_codegen::Node::emit_with(&single_module, &mut emitter).unwrap();
    }
    let code = String::from_utf8(buf).unwrap();
    code.lines()
        .find(|l| !l.trim().is_empty())
        .unwrap_or("")
        .to_string()
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
