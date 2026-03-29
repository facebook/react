use react_compiler_ast::expressions::Identifier as AstIdentifier;
use react_compiler_ast::patterns::PatternLike;
use react_compiler_ast::statements::BlockStatement;
use react_compiler_diagnostics::SourceLocation;
use react_compiler_hir::ReactFunctionType;
use serde::Serialize;

use crate::timing::TimingEntry;

/// A variable rename from lowering, serialized for the JS shim.
#[derive(Debug, Clone, Serialize)]
pub struct BindingRenameInfo {
    pub original: String,
    pub renamed: String,
    #[serde(rename = "declarationStart")]
    pub declaration_start: u32,
}

/// Main result type returned by the compile function.
/// Serialized to JSON and returned to the JS shim.
#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum CompileResult {
    /// Compilation succeeded (or no functions needed compilation).
    /// `ast` is None if no changes were made to the program.
    /// The AST is stored as a pre-serialized JSON string (RawValue) to avoid
    /// double-serialization: File→Value→String becomes File→String directly.
    Success {
        ast: Option<Box<serde_json::value::RawValue>>,
        events: Vec<LoggerEvent>,
        /// Unified ordered log interleaving events and debug entries.
        /// Items appear in the order they were emitted during compilation.
        /// The JS side uses this as the single source of truth (preferred over
        /// separate events/debugLogs arrays).
        #[serde(rename = "orderedLog", skip_serializing_if = "Vec::is_empty")]
        ordered_log: Vec<OrderedLogItem>,
        /// Variable renames from lowering, for applying back to the Babel AST.
        /// Each entry maps an original binding name to its renamed version,
        /// identified by the binding's declaration start position in the source.
        #[serde(skip_serializing_if = "Vec::is_empty")]
        renames: Vec<BindingRenameInfo>,
        /// Timing data for profiling. Only populated when __profiling is enabled.
        #[serde(skip_serializing_if = "Vec::is_empty")]
        timing: Vec<TimingEntry>,
    },
    /// A fatal error occurred and panicThreshold dictates it should throw.
    Error {
        error: CompilerErrorInfo,
        events: Vec<LoggerEvent>,
        #[serde(rename = "orderedLog", skip_serializing_if = "Vec::is_empty")]
        ordered_log: Vec<OrderedLogItem>,
        /// Timing data for profiling. Only populated when __profiling is enabled.
        #[serde(skip_serializing_if = "Vec::is_empty")]
        timing: Vec<TimingEntry>,
    },
}

/// An item in the ordered log, which can be either a logger event or a debug entry.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum OrderedLogItem {
    Event { event: LoggerEvent },
    Debug { entry: DebugLogEntry },
}

/// Structured error information for the JS shim.
#[derive(Debug, Clone, Serialize)]
pub struct CompilerErrorInfo {
    pub reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub details: Vec<CompilerErrorDetailInfo>,
}

/// Serializable error detail.
#[derive(Debug, Clone, Serialize)]
pub struct CompilerErrorDetailInfo {
    pub category: String,
    pub reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub severity: Option<String>,
    /// Error/hint items. When present, these carry location info
    /// instead of the top-level `loc` field.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Vec<CompilerErrorItemInfo>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
}

/// Individual error or hint item within a CompilerErrorDetailInfo.
#[derive(Debug, Clone, Serialize)]
pub struct CompilerErrorItemInfo {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

/// Debug log entry for debugLogIRs support.
/// Currently only supports the 'debug' variant (string values).
#[derive(Debug, Clone, Serialize)]
pub struct DebugLogEntry {
    pub kind: &'static str,
    pub name: String,
    pub value: String,
}

impl DebugLogEntry {
    pub fn new(name: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            kind: "debug",
            name: name.into(),
            value: value.into(),
        }
    }
}

/// Codegen output for a single compiled function.
/// Carries the generated AST fields needed to replace the original function.
#[derive(Debug, Clone)]
pub struct CodegenFunction {
    pub loc: Option<SourceLocation>,
    pub id: Option<AstIdentifier>,
    pub name_hint: Option<String>,
    pub params: Vec<PatternLike>,
    pub body: BlockStatement,
    pub generator: bool,
    pub is_async: bool,
    pub memo_slots_used: u32,
    pub memo_blocks: u32,
    pub memo_values: u32,
    pub pruned_memo_blocks: u32,
    pub pruned_memo_values: u32,
    pub outlined: Vec<OutlinedFunction>,
}

/// An outlined function extracted during compilation.
#[derive(Debug, Clone)]
pub struct OutlinedFunction {
    pub func: CodegenFunction,
    pub fn_type: Option<ReactFunctionType>,
}

/// Logger events emitted during compilation.
/// These are returned to JS for the logger callback.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind")]
pub enum LoggerEvent {
    CompileSuccess {
        #[serde(rename = "fnLoc", skip_serializing_if = "Option::is_none")]
        fn_loc: Option<SourceLocation>,
        #[serde(rename = "fnName", skip_serializing_if = "Option::is_none")]
        fn_name: Option<String>,
        #[serde(rename = "memoSlots")]
        memo_slots: u32,
        #[serde(rename = "memoBlocks")]
        memo_blocks: u32,
        #[serde(rename = "memoValues")]
        memo_values: u32,
        #[serde(rename = "prunedMemoBlocks")]
        pruned_memo_blocks: u32,
        #[serde(rename = "prunedMemoValues")]
        pruned_memo_values: u32,
    },
    CompileError {
        #[serde(rename = "fnLoc", skip_serializing_if = "Option::is_none")]
        fn_loc: Option<SourceLocation>,
        detail: CompilerErrorDetailInfo,
    },
    CompileSkip {
        #[serde(rename = "fnLoc", skip_serializing_if = "Option::is_none")]
        fn_loc: Option<SourceLocation>,
        reason: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        loc: Option<SourceLocation>,
    },
    CompileUnexpectedThrow {
        #[serde(rename = "fnLoc", skip_serializing_if = "Option::is_none")]
        fn_loc: Option<SourceLocation>,
        data: String,
    },
    PipelineError {
        #[serde(rename = "fnLoc", skip_serializing_if = "Option::is_none")]
        fn_loc: Option<SourceLocation>,
        data: String,
    },
}
