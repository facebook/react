use serde::Serialize;
use react_compiler_diagnostics::SourceLocation;

/// Main result type returned by the compile function.
/// Serialized to JSON and returned to the JS shim.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum CompileResult {
    /// Compilation succeeded (or no functions needed compilation).
    /// `ast` is None if no changes were made to the program.
    Success {
        ast: Option<serde_json::Value>,
        events: Vec<LoggerEvent>,
        #[serde(rename = "debugLogs", skip_serializing_if = "Vec::is_empty")]
        debug_logs: Vec<DebugLogEntry>,
    },
    /// A fatal error occurred and panicThreshold dictates it should throw.
    Error {
        error: CompilerErrorInfo,
        events: Vec<LoggerEvent>,
        #[serde(rename = "debugLogs", skip_serializing_if = "Vec::is_empty")]
        debug_logs: Vec<DebugLogEntry>,
    },
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
    pub loc: Option<SourceLocation>,
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
