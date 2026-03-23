// pub mod convert_ast;
pub mod convert_ast_reverse;
pub mod convert_scope;
pub mod diagnostics;
pub mod prefilter;

// use convert_ast::convert_program;
use convert_scope::convert_scope_info;
use diagnostics::compile_result_to_diagnostics;
use prefilter::has_react_like_functions;
use react_compiler::entrypoint::compile_result::{CompileResult, LoggerEvent};
use react_compiler::entrypoint::plugin_options::PluginOptions;

/// Result of compiling a program via the OXC frontend.
pub struct TransformResult {
    /// The compiled program AST as JSON (None if no changes needed).
    pub program_json: Option<serde_json::Value>,
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
    _source_text: &str,
    options: PluginOptions,
) -> TransformResult {
    // Prefilter: skip files without React-like functions (unless compilationMode == "all")
    if options.compilation_mode != "all" && !has_react_like_functions(program) {
        return TransformResult {
            program_json: None,
            diagnostics: vec![],
            events: vec![],
        };
    }

    // Convert OXC AST to react_compiler_ast
    // let file = convert_program(program, source_text);

    // Convert OXC semantic to ScopeInfo
    let _scope_info = convert_scope_info(semantic, program);

    // TODO: Run the compiler once convert_ast is implemented
    // For now, return a success result with no changes
    let result = CompileResult::Success {
        ast: None,
        events: vec![],
        debug_logs: vec![],
        ordered_log: vec![],
    };
    // let result = react_compiler::entrypoint::program::compile_program(file, scope_info, options);

    // Extract diagnostics and events
    let diagnostics = compile_result_to_diagnostics(&result);
    let (program_json, events) = match result {
        CompileResult::Success {
            ast, events, ..
        } => (ast, events),
        CompileResult::Error {
            events, ..
        } => (None, events),
    };

    TransformResult {
        program_json,
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
pub fn emit(file: &react_compiler_ast::File, allocator: &oxc_allocator::Allocator) -> String {
    let program = convert_ast_reverse::convert_program_to_oxc(file, allocator);
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
