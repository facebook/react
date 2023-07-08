use estree::SourceRange;
use hir::BlockId;
use miette::{ByteOffset, Diagnostic, SourceSpan};
use thiserror::Error;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Error)]
pub enum ErrorSeverity {
    /// A feature that is intended to work but not yet implemented
    #[error("Not implemented")]
    Todo,

    /// Syntax that is valid but inentionally not supported
    #[error("Unsupported")]
    Unsupported,

    /// Invalid syntax
    #[error("Invalid JavaScript")]
    InvalidSyntax,

    /// Valid syntax, but invalid React
    #[error("Invalid React")]
    InvalidReact,

    /// Internal compiler error (ICE)
    #[error("Internal error")]
    Invariant,
}

/// Errors which can occur during HIR construction
#[derive(Error, Diagnostic, Debug)]
pub enum DiagnosticError {
    /// ErrorSeverity::Unsupported
    #[error(
        "Variable declarations must be `let` or `const`, `var` declarations are not supported"
    )]
    VariableDeclarationKindIsVar,

    /// ErrorSeverity::Invariant
    #[error("Invariant: Expected variable declaration to declare a fresh binding")]
    VariableDeclarationBindingIsNonLocal,

    /// ErrorSeverity::Todo
    #[error("`for` statements must have an initializer, eg `for (**let i = 0**; ...)`")]
    ForStatementIsMissingInitializer,

    /// ErrorSeverity::Todo
    #[error(
        "`for` statements must have a test condition, eg `for (let i = 0; **i < count**; ...)`"
    )]
    ForStatementIsMissingTest,

    /// ErrorSeverity::Invariant
    #[error("Invariant: Expected an expression node")]
    NonExpressionInExpressionPosition,

    /// ErrorSeverity::InvalidReact
    #[error("React functions may not reassign variables defined outside of the component or hook")]
    ReassignedGlobal,

    /// ErrorSeverity::Invariant
    #[error("Invariant: Expected block {block} not to have been visited yet")]
    BlockVisitedTwice { block: BlockId },

    /// ErrorSeverity::InvalidSyntax
    #[error("Could not resolve a target for `break` statement")]
    UnresolvedBreakTarget,

    /// ErrorSeverity::InvalidSyntax
    #[error("Could not resolve a target for `continue` statement")]
    UnresolvedContinueTarget,

    /// ErrorSeverity::InvalidSyntax
    #[error("Labeled `continue` statements must use the label of a loop statement")]
    ContinueTargetIsNotALoop,

    /// ErrorSeverity::Invariant
    #[error("Invariant: Identifier was not resolved (did name resolution run successfully?)")]
    UnknownIdentifier,
}

#[derive(Error, Diagnostic, Debug)]
#[error("{error}")]
pub struct BuildDiagnostic {
    /// The actual error
    pub error: DiagnosticError,

    /// Error severity
    pub severity: ErrorSeverity,

    /// Source of the error
    #[label]
    pub range: Option<SourceSpan>,
}

impl BuildDiagnostic {
    pub fn new(
        error: DiagnosticError,
        severity: ErrorSeverity,
        range: Option<SourceRange>,
    ) -> Self {
        Self {
            error,
            severity,
            range: range.map(|range| {
                SourceSpan::new(
                    ByteOffset::from(range.start as usize - 1).into(),
                    ByteOffset::from((u32::from(range.end) - range.start) as usize).into(),
                )
            }),
        }
    }
}

/// Returns Ok(()) if the condition is true, otherwise returns Err()
/// with the diagnostic produced by the provided callback
pub fn invariant<F>(cond: bool, f: F) -> Result<(), BuildDiagnostic>
where
    F: FnOnce() -> BuildDiagnostic,
{
    if cond {
        Ok(())
    } else {
        Err(f())
    }
}
