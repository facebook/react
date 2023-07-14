use forget_hir::BlockId;
use thiserror::Error;

/// Errors which can occur during HIR construction
#[derive(Error, Debug)]
pub enum BuildHIRError {
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

    /// ErrorSeverity::InvalidSyntax
    #[error("Expected function to have a body")]
    EmptyFunction,
}
