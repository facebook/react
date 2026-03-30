use serde::{Serialize, Deserialize};

/// Error categories matching the TS ErrorCategory enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorCategory {
    Hooks,
    CapitalizedCalls,
    StaticComponents,
    UseMemo,
    VoidUseMemo,
    PreserveManualMemo,
    MemoDependencies,
    IncompatibleLibrary,
    Immutability,
    Globals,
    Refs,
    EffectDependencies,
    EffectExhaustiveDependencies,
    EffectSetState,
    EffectDerivationsOfState,
    ErrorBoundaries,
    Purity,
    RenderSetState,
    Invariant,
    Todo,
    Syntax,
    UnsupportedSyntax,
    Config,
    Gating,
    Suppression,
    FBT,
}

/// Error severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorSeverity {
    Error,
    Warning,
    Hint,
    Off,
}

impl ErrorCategory {
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            // These map to "Compilation Skipped" (Warning severity)
            ErrorCategory::EffectDependencies
            | ErrorCategory::IncompatibleLibrary
            | ErrorCategory::PreserveManualMemo
            | ErrorCategory::UnsupportedSyntax => ErrorSeverity::Warning,

            // Todo is Hint
            ErrorCategory::Todo => ErrorSeverity::Hint,

            // Invariant and all others are Error severity
            _ => ErrorSeverity::Error,
        }
    }
}

/// Suggestion operations for auto-fixes
#[derive(Debug, Clone, Serialize)]
pub enum CompilerSuggestionOperation {
    InsertBefore,
    InsertAfter,
    Remove,
    Replace,
}

/// A compiler suggestion for fixing an error
#[derive(Debug, Clone, Serialize)]
pub struct CompilerSuggestion {
    pub op: CompilerSuggestionOperation,
    pub range: (usize, usize),
    pub description: String,
    pub text: Option<String>, // None for Remove operations
}

/// Source location (matches Babel's SourceLocation format)
/// This is the HIR source location, separate from AST's BaseNode location.
/// GeneratedSource is represented as None.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SourceLocation {
    pub start: Position,
    pub end: Position,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub column: u32,
    /// Byte offset in the source file. Preserved for logger event serialization.
    #[serde(default, skip_serializing)]
    pub index: Option<u32>,
}

/// Sentinel value for generated/synthetic source locations
pub const GENERATED_SOURCE: Option<SourceLocation> = None;

/// Detail for a diagnostic
#[derive(Debug, Clone, Serialize)]
pub enum CompilerDiagnosticDetail {
    Error {
        loc: Option<SourceLocation>,
        message: Option<String>,
        /// The identifier name from the AST source location, if this error
        /// points to an identifier node. Preserved for logger event serialization
        /// to match Babel's SourceLocation.identifierName field.
        #[serde(skip)]
        identifier_name: Option<String>,
    },
    Hint {
        message: String,
    },
}

/// A single compiler diagnostic (new-style)
#[derive(Debug, Clone)]
pub struct CompilerDiagnostic {
    pub category: ErrorCategory,
    pub reason: String,
    pub description: Option<String>,
    pub details: Vec<CompilerDiagnosticDetail>,
    pub suggestions: Option<Vec<CompilerSuggestion>>,
}

impl CompilerDiagnostic {
    pub fn new(
        category: ErrorCategory,
        reason: impl Into<String>,
        description: Option<String>,
    ) -> Self {
        Self {
            category,
            reason: reason.into(),
            description,
            details: Vec::new(),
            suggestions: None,
        }
    }

    pub fn severity(&self) -> ErrorSeverity {
        self.category.severity()
    }

    pub fn with_detail(mut self, detail: CompilerDiagnosticDetail) -> Self {
        self.details.push(detail);
        self
    }

    pub fn primary_location(&self) -> Option<&SourceLocation> {
        self.details.iter().find_map(|d| match d {
            CompilerDiagnosticDetail::Error { loc, .. } => loc.as_ref(), // identifier_name covered by ..
            _ => None,
        })
    }

}

/// Legacy-style error detail (matches CompilerErrorDetail in TS)
#[derive(Debug, Clone, Serialize)]
pub struct CompilerErrorDetail {
    pub category: ErrorCategory,
    pub reason: String,
    pub description: Option<String>,
    pub loc: Option<SourceLocation>,
    pub suggestions: Option<Vec<CompilerSuggestion>>,
}

impl CompilerErrorDetail {
    pub fn new(category: ErrorCategory, reason: impl Into<String>) -> Self {
        Self {
            category,
            reason: reason.into(),
            description: None,
            loc: None,
            suggestions: None,
        }
    }

    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn with_loc(mut self, loc: Option<SourceLocation>) -> Self {
        self.loc = loc;
        self
    }

    pub fn severity(&self) -> ErrorSeverity {
        self.category.severity()
    }
}

/// Aggregate compiler error - can contain multiple diagnostics.
/// This is the main error type thrown/returned by the compiler.
#[derive(Debug, Clone)]
pub struct CompilerError {
    pub details: Vec<CompilerErrorOrDiagnostic>,
}

/// Either a new-style diagnostic or legacy error detail
#[derive(Debug, Clone)]
pub enum CompilerErrorOrDiagnostic {
    Diagnostic(CompilerDiagnostic),
    ErrorDetail(CompilerErrorDetail),
}

impl CompilerErrorOrDiagnostic {
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            Self::Diagnostic(d) => d.severity(),
            Self::ErrorDetail(d) => d.severity(),
        }
    }
}

impl CompilerError {
    pub fn new() -> Self {
        Self {
            details: Vec::new(),
        }
    }

    pub fn push_diagnostic(&mut self, diagnostic: CompilerDiagnostic) {
        if diagnostic.severity() != ErrorSeverity::Off {
            self.details
                .push(CompilerErrorOrDiagnostic::Diagnostic(diagnostic));
        }
    }

    pub fn push_error_detail(&mut self, detail: CompilerErrorDetail) {
        if detail.severity() != ErrorSeverity::Off {
            self.details
                .push(CompilerErrorOrDiagnostic::ErrorDetail(detail));
        }
    }

    pub fn has_errors(&self) -> bool {
        self.details
            .iter()
            .any(|d| d.severity() == ErrorSeverity::Error)
    }

    pub fn has_any_errors(&self) -> bool {
        !self.details.is_empty()
    }

    /// Check if any error detail has Invariant category.
    pub fn has_invariant_errors(&self) -> bool {
        self.details.iter().any(|d| {
            let cat = match d {
                CompilerErrorOrDiagnostic::Diagnostic(d) => d.category,
                CompilerErrorOrDiagnostic::ErrorDetail(d) => d.category,
            };
            cat == ErrorCategory::Invariant
        })
    }

    pub fn merge(&mut self, other: CompilerError) {
        self.details.extend(other.details);
    }

    /// Check if all error details are non-invariant.
    /// In TS, this is used to determine if an error thrown during compilation
    /// should be logged as CompileUnexpectedThrow.
    pub fn is_all_non_invariant(&self) -> bool {
        self.details.iter().all(|d| {
            let cat = match d {
                CompilerErrorOrDiagnostic::Diagnostic(d) => d.category,
                CompilerErrorOrDiagnostic::ErrorDetail(d) => d.category,
            };
            cat != ErrorCategory::Invariant
        })
    }
}

impl Default for CompilerError {
    fn default() -> Self {
        Self::new()
    }
}

impl From<CompilerDiagnostic> for CompilerError {
    fn from(diagnostic: CompilerDiagnostic) -> Self {
        let mut error = CompilerError::new();
        error.push_diagnostic(diagnostic);
        error
    }
}

impl std::fmt::Display for CompilerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for detail in &self.details {
            match detail {
                CompilerErrorOrDiagnostic::Diagnostic(d) => {
                    write!(f, "{}: {}", format_category_heading(d.category), d.reason)?;
                    if let Some(desc) = &d.description {
                        write!(f, ". {}.", desc)?;
                    }
                }
                CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                    write!(f, "{}: {}", format_category_heading(d.category), d.reason)?;
                    if let Some(desc) = &d.description {
                        write!(f, ". {}.", desc)?;
                    }
                }
            }
            writeln!(f)?;
        }
        Ok(())
    }
}

impl std::error::Error for CompilerError {}

fn format_category_heading(category: ErrorCategory) -> &'static str {
    match category {
        ErrorCategory::EffectDependencies
        | ErrorCategory::IncompatibleLibrary
        | ErrorCategory::PreserveManualMemo
        | ErrorCategory::UnsupportedSyntax => "Compilation Skipped",
        ErrorCategory::Invariant => "Invariant",
        ErrorCategory::Todo => "Todo",
        _ => "Error",
    }
}
