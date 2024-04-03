/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::error::Error;
use std::fmt::{Debug, Display, Write};

use miette::SourceSpan;
use react_estree::SourceRange;
use static_assertions::assert_impl_all;
use thiserror::Error;

pub type Diagnostics = Vec<Diagnostic>;
pub type DiagnosticsResult<T> = Result<T, Diagnostics>;

#[derive(Debug)]
pub struct WithDiagnostics<T> {
    pub item: T,
    pub diagnostics: Vec<Diagnostic>,
}

impl<T> From<WithDiagnostics<T>> for Result<T, Diagnostics> {
    fn from(s: WithDiagnostics<T>) -> Result<T, Diagnostics> {
        if s.diagnostics.is_empty() {
            Ok(s.item)
        } else {
            Err(s.diagnostics)
        }
    }
}

pub fn diagnostics_result<T>(result: T, diagnostics: Diagnostics) -> DiagnosticsResult<T> {
    if diagnostics.is_empty() {
        Ok(result)
    } else {
        Err(diagnostics)
    }
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Error)]
pub enum DiagnosticSeverity {
    /// A feature that is intended to work but not yet implemented
    #[error("Not implemented")]
    Todo,

    /// Syntax that is valid but intentionally not supported
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

/// A diagnostic message as a result of validating some code. This struct is
/// modeled after the LSP Diagnostic type:
/// https://microsoft.github.io/language-server-protocol/specification#diagnostic
///
/// Changes from LSP:
/// - `location` is different from LSP in that it's a file + span instead of
///   just a span.
/// - Unused fields are omitted.
/// - Severity is a custom enum that represents React-specific categories of error.
///   The translation to an LSP error/warning/etc depends on compiler settings and
///   invocation context.
#[derive(Debug)]
pub struct Diagnostic(Box<DiagnosticData>);

impl Diagnostic {
    fn with_severity<T: 'static + DiagnosticDisplay>(
        severity: DiagnosticSeverity,
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        Self(Box::new(DiagnosticData {
            message: Box::new(message),
            span: range.map(source_span_from_range),
            related_information: Vec::new(),
            severity,
            data: Vec::new(),
        }))
    }

    /// Creates a new Todo Diagnostic.
    /// Additional locations can be added with the `.annotate()` function.
    pub fn todo<T: 'static + DiagnosticDisplay>(message: T, range: Option<SourceRange>) -> Self {
        Diagnostic::with_severity(DiagnosticSeverity::Todo, message, range)
    }

    /// Creates a new Unsupported Diagnostic.
    /// Additional locations can be added with the `.annotate()` function.
    pub fn unsupported<T: 'static + DiagnosticDisplay>(
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        Diagnostic::with_severity(DiagnosticSeverity::Unsupported, message, range)
    }

    /// Creates a new InvalidSyntax Diagnostic.
    /// Additional locations can be added with the `.annotate()` function.
    pub fn invalid_syntax<T: 'static + DiagnosticDisplay>(
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        Diagnostic::with_severity(DiagnosticSeverity::InvalidSyntax, message, range)
    }

    /// Creates a new InvalidReact Diagnostic.
    /// Additional locations can be added with the `.annotate()` function.
    pub fn invalid_react<T: 'static + DiagnosticDisplay>(
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        Diagnostic::with_severity(DiagnosticSeverity::InvalidReact, message, range)
    }

    /// Creates a new InvalidReact Diagnostic.
    /// Additional locations can be added with the `.annotate()` function.
    pub fn invariant<T: 'static + DiagnosticDisplay>(
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        Diagnostic::with_severity(DiagnosticSeverity::Invariant, message, range)
    }

    /// Annotates this error with an additional location and associated message.
    pub fn annotate<T: 'static + DiagnosticDisplay>(
        mut self,
        message: T,
        range: Option<SourceRange>,
    ) -> Self {
        self.0
            .related_information
            .push(DiagnosticRelatedInformation {
                message: Box::new(message),
                span: range.map(source_span_from_range),
            });
        self
    }

    pub fn message(&self) -> &impl DiagnosticDisplay {
        &self.0.message
    }

    pub fn span(&self) -> Option<SourceSpan> {
        self.0.span
    }

    pub fn get_data(&self) -> &[impl DiagnosticDisplay] {
        &self.0.data
    }

    pub fn severity(&self) -> DiagnosticSeverity {
        self.0.severity
    }

    pub fn related_information(&self) -> &[DiagnosticRelatedInformation] {
        &self.0.related_information
    }

    pub fn print_without_source(&self) -> String {
        let mut result = String::new();
        writeln!(
            result,
            "{message}:{span:?}",
            message = &self.0.message,
            span = self.0.span
        )
        .unwrap();
        if !self.0.related_information.is_empty() {
            for (ix, related) in self.0.related_information.iter().enumerate() {
                writeln!(
                    result,
                    "[related {ix}] {message}:{span:?}",
                    ix = ix + 1,
                    message = related.message,
                    span = related.span
                )
                .unwrap();
            }
        };
        result
    }
}

impl Display for Diagnostic {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.message)
    }
}

impl Error for Diagnostic {}

impl miette::Diagnostic for Diagnostic {
    fn help<'a>(&'a self) -> Option<Box<dyn Display + 'a>> {
        Some(Box::new(self.0.message.to_string()))
    }

    fn labels(&self) -> Option<Box<dyn Iterator<Item = miette::LabeledSpan> + '_>> {
        let related_items = &self.0.related_information;
        let mut spans: Vec<miette::LabeledSpan> = Vec::new();
        for related in related_items {
            if let Some(span) = related.span {
                spans.push(miette::LabeledSpan::new_with_span(
                    Some(related.message.to_string()),
                    span,
                ))
            }
        }
        if spans.is_empty() {
            if let Some(span) = self.0.span {
                spans.push(miette::LabeledSpan::new_with_span(
                    Some(self.0.message.to_string()),
                    span,
                ))
            }
        }
        Some(Box::new(spans.into_iter()))
    }
}

// Ensure Diagnostic is thread-safe
assert_impl_all!(Diagnostic: Send, Sync);

#[derive(Debug)]
struct DiagnosticData {
    /// Human readable error message.
    message: Box<dyn DiagnosticDisplay>,

    /// The primary location of this diagnostic.
    span: Option<SourceSpan>,

    /// Related diagnostic information, such as other definitions in the case of
    /// a duplicate definition error.
    related_information: Vec<DiagnosticRelatedInformation>,

    severity: DiagnosticSeverity,

    /// A list with data that can be passed to the code actions
    /// `data` is used in the LSP protocol:
    /// @see https://microsoft.github.io/language-server-protocol/specifications/specification-current/#diagnostic
    data: Vec<Box<dyn DiagnosticDisplay>>,
}

/// Secondary locations attached to a diagnostic.
#[derive(Debug)]
pub struct DiagnosticRelatedInformation {
    /// The message of this related diagnostic information.
    pub message: Box<dyn DiagnosticDisplay>,

    /// The location of this related diagnostic information.
    pub span: Option<SourceSpan>,
}

/// Trait for diagnostic messages to allow structs that capture
/// some data and can lazily convert it to a message.
pub trait DiagnosticDisplay: Debug + Display + Send + Sync {}

/// Automatically implement the trait if constraints are met, so that
/// implementors don't need to.
impl<T> DiagnosticDisplay for T where T: Debug + Display + Send + Sync {}

impl From<Diagnostic> for Diagnostics {
    fn from(diagnostic: Diagnostic) -> Self {
        vec![diagnostic]
    }
}

fn source_span_from_range(range: SourceRange) -> SourceSpan {
    SourceSpan::new(
        (range.start as usize).into(),
        ((u32::from(range.end) - range.start) as usize).into(),
    )
}
