pub mod convert_ast;
pub mod convert_ast_reverse;
pub mod convert_scope;
pub mod diagnostics;
pub mod prefilter;

use convert_ast::convert_program;
use convert_scope::convert_scope_info;
use diagnostics::compile_result_to_diagnostics;
use prefilter::has_react_like_functions;
use react_compiler::entrypoint::compile_result::LoggerEvent;
use react_compiler::entrypoint::plugin_options::PluginOptions;

/// Result of compiling a program via the OXC frontend.
pub struct TransformResult {
    /// The compiled program as a react_compiler_ast File (None if no changes needed).
    pub file: Option<react_compiler_ast::File>,
    pub diagnostics: Vec<oxc_diagnostics::OxcDiagnostic>,
    pub events: Vec<LoggerEvent>,
}

/// Result of linting a program via the OXC frontend.
pub struct LintResult {
    pub diagnostics: Vec<oxc_diagnostics::OxcDiagnostic>,
}

/// Primary transform API — accepts pre-parsed OXC AST + semantic.
pub fn transform(
    program: &oxc_ast::ast::Program,
    semantic: &oxc_semantic::Semantic,
    source_text: &str,
    options: PluginOptions,
) -> TransformResult {
    // Prefilter: skip files without React-like functions (unless compilationMode == "all")
    if options.compilation_mode != "all" && !has_react_like_functions(program) {
        return TransformResult {
            file: None,
            diagnostics: vec![],
            events: vec![],
        };
    }

    // Convert OXC AST to react_compiler_ast
    let file = convert_program(program, source_text);

    // Convert OXC semantic to ScopeInfo
    let scope_info = convert_scope_info(semantic, program);

    // Run the compiler
    let result =
        react_compiler::entrypoint::program::compile_program(file, scope_info, options);

    let diagnostics = compile_result_to_diagnostics(&result);
    let (program_ast, events) = match result {
        react_compiler::entrypoint::compile_result::CompileResult::Success {
            ast, events, ..
        } => (ast, events),
        react_compiler::entrypoint::compile_result::CompileResult::Error {
            events, ..
        } => (None, events),
    };

    let compiled_file = program_ast.and_then(|raw_json| {
        // First parse to serde_json::Value which deduplicates "type" fields
        // (the compiler output can produce duplicate "type" keys due to
        // BaseNode.node_type + #[serde(tag = "type")] enum tagging)
        let value: serde_json::Value = serde_json::from_str(raw_json.get()).ok()?;
        serde_json::from_value(value).ok()
    });

    TransformResult {
        file: compiled_file,
        diagnostics,
        events,
    }
}

/// Convenience wrapper — parses source text, runs semantic analysis, then transforms.
pub fn transform_source(
    source_text: &str,
    source_type: oxc_span::SourceType,
    options: PluginOptions,
) -> TransformResult {
    let allocator = oxc_allocator::Allocator::default();
    let parsed = oxc_parser::Parser::new(&allocator, source_text, source_type).parse();

    let semantic = oxc_semantic::SemanticBuilder::new()
        .build(&parsed.program)
        .semantic;

    transform(&parsed.program, &semantic, source_text, options)
}

/// Lint API — accepts pre-parsed OXC AST + semantic.
/// Same as transform but only collects diagnostics, no AST output.
pub fn lint(
    program: &oxc_ast::ast::Program,
    semantic: &oxc_semantic::Semantic,
    source_text: &str,
    options: PluginOptions,
) -> LintResult {
    let mut opts = options;
    opts.no_emit = true;

    let result = transform(program, semantic, source_text, opts);
    LintResult {
        diagnostics: result.diagnostics,
    }
}

/// Emit a react_compiler_ast::File to a string via OXC codegen.
/// Converts the File to an OXC Program, then uses oxc_codegen to emit.
///
/// If `source_text` is provided, comments from the original source will be
/// preserved in the output by re-parsing the source to extract comments and
/// injecting them into the OXC program before codegen.
pub fn emit(
    file: &react_compiler_ast::File,
    allocator: &oxc_allocator::Allocator,
    source_text: Option<&str>,
) -> String {
    let mut program = if let Some(source) = source_text {
        convert_ast_reverse::convert_program_to_oxc_with_source(file, allocator, source)
    } else {
        convert_ast_reverse::convert_program_to_oxc(file, allocator)
    };

    if let Some(source) = source_text {
        // Re-parse the original source to extract comments.
        // We use a separate allocator for the parse since we only need the comments.
        let comment_allocator = oxc_allocator::Allocator::default();
        // Parse as TSX to handle maximum syntax variety
        let source_type = oxc_span::SourceType::tsx();
        let parsed =
            oxc_parser::Parser::new(&comment_allocator, source, source_type).parse();

        // Collect the span starts of top-level statements in the compiled
        // program. Only comments attached to these positions should be
        // preserved — comments inside function bodies would have
        // `attached_to` values that don't match any top-level statement.
        let mut top_level_starts = std::collections::HashSet::new();
        top_level_starts.insert(0u32); // position 0 for comments at the very start
        for stmt in &program.body {
            use oxc_span::GetSpan;
            let start = stmt.span().start;
            if start > 0 {
                top_level_starts.insert(start);
            }
        }

        // Copy only comments attached to top-level statements.
        let mut comments = oxc_allocator::Vec::with_capacity_in(
            parsed.program.comments.len(),
            allocator,
        );
        for comment in &parsed.program.comments {
            if top_level_starts.contains(&comment.attached_to) {
                comments.push(*comment);
            }
        }
        program.comments = comments;

        // Set the source_text so the codegen can extract comment content
        // from the original source spans.
        // We copy the source into the allocator to guarantee the lifetime.
        let source_in_alloc =
            oxc_allocator::StringBuilder::from_str_in(source, allocator);
        program.source_text = source_in_alloc.into_str();
    }

    oxc_codegen::Codegen::new().build(&program).code
}

/// Convenience wrapper — parses source text, runs semantic analysis, then lints.
pub fn lint_source(
    source_text: &str,
    source_type: oxc_span::SourceType,
    options: PluginOptions,
) -> LintResult {
    let allocator = oxc_allocator::Allocator::default();
    let parsed = oxc_parser::Parser::new(&allocator, source_text, source_type).parse();

    let semantic = oxc_semantic::SemanticBuilder::new()
        .build(&parsed.program)
        .semantic;

    lint(&parsed.program, &semantic, source_text, options)
}
