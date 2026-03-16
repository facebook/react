/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use react_compiler_ast::common::{Comment, CommentData};
use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerDiagnosticDetail, CompilerError, CompilerSuggestion,
    CompilerSuggestionOperation, ErrorCategory,
};
use regex::Regex;

#[derive(Debug, Clone)]
pub enum SuppressionSource {
    Eslint,
    Flow,
}

/// Captures the start and end range of a pair of eslint-disable ... eslint-enable comments.
/// In the case of a CommentLine or a relevant Flow suppression, both the disable and enable
/// point to the same comment.
///
/// The enable comment can be missing in the case where only a disable block is present,
/// ie the rest of the file has potential React violations.
#[derive(Debug, Clone)]
pub struct SuppressionRange {
    pub disable_comment: CommentData,
    pub enable_comment: Option<CommentData>,
    pub source: SuppressionSource,
}

fn comment_data(comment: &Comment) -> &CommentData {
    match comment {
        Comment::CommentBlock(data) | Comment::CommentLine(data) => data,
    }
}

/// Parse eslint-disable/enable and Flow suppression comments from program comments.
/// Equivalent to findProgramSuppressions in Suppression.ts
pub fn find_program_suppressions(
    comments: &[Comment],
    rule_names: Option<&[String]>,
    flow_suppressions: bool,
) -> Vec<SuppressionRange> {
    let mut suppression_ranges: Vec<SuppressionRange> = Vec::new();
    let mut disable_comment: Option<CommentData> = None;
    let mut enable_comment: Option<CommentData> = None;
    let mut source: Option<SuppressionSource> = None;

    // Build eslint patterns from rule names
    let (disable_next_line_pattern, disable_pattern, enable_pattern) =
        if let Some(names) = rule_names {
            if !names.is_empty() {
                let rule_pattern = format!("({})", names.join("|"));
                (
                    Some(
                        Regex::new(&format!("eslint-disable-next-line {}", rule_pattern))
                            .expect("Invalid disable-next-line regex"),
                    ),
                    Some(
                        Regex::new(&format!("eslint-disable {}", rule_pattern))
                            .expect("Invalid disable regex"),
                    ),
                    Some(
                        Regex::new(&format!("eslint-enable {}", rule_pattern))
                            .expect("Invalid enable regex"),
                    ),
                )
            } else {
                (None, None, None)
            }
        } else {
            (None, None, None)
        };

    let flow_suppression_pattern =
        Regex::new(r"\$(FlowFixMe\w*|FlowExpectedError|FlowIssue)\[react\-rule")
            .expect("Invalid flow suppression regex");

    for comment in comments {
        let data = comment_data(comment);

        if data.start.is_none() || data.end.is_none() {
            continue;
        }

        // Check for eslint-disable-next-line (only if not already within a block)
        if disable_comment.is_none() {
            if let Some(ref pattern) = disable_next_line_pattern {
                if pattern.is_match(&data.value) {
                    disable_comment = Some(data.clone());
                    enable_comment = Some(data.clone());
                    source = Some(SuppressionSource::Eslint);
                }
            }
        }

        // Check for Flow suppression (only if not already within a block)
        if flow_suppressions && disable_comment.is_none() && flow_suppression_pattern.is_match(&data.value) {
            disable_comment = Some(data.clone());
            enable_comment = Some(data.clone());
            source = Some(SuppressionSource::Flow);
        }

        // Check for eslint-disable (block start)
        if let Some(ref pattern) = disable_pattern {
            if pattern.is_match(&data.value) {
                disable_comment = Some(data.clone());
                source = Some(SuppressionSource::Eslint);
            }
        }

        // Check for eslint-enable (block end)
        if let Some(ref pattern) = enable_pattern {
            if pattern.is_match(&data.value) {
                if matches!(source, Some(SuppressionSource::Eslint)) {
                    enable_comment = Some(data.clone());
                }
            }
        }

        // If we have a complete suppression, push it
        if disable_comment.is_some() && source.is_some() {
            suppression_ranges.push(SuppressionRange {
                disable_comment: disable_comment.take().unwrap(),
                enable_comment: enable_comment.take(),
                source: source.take().unwrap(),
            });
        }
    }

    suppression_ranges
}

/// Check if suppression ranges overlap with a function's source range.
/// A suppression affects a function if:
/// 1. The suppression is within the function's body
/// 2. The suppression wraps the function
pub fn filter_suppressions_that_affect_function(
    suppressions: &[SuppressionRange],
    fn_start: u32,
    fn_end: u32,
) -> Vec<&SuppressionRange> {
    let mut suppressions_in_scope: Vec<&SuppressionRange> = Vec::new();

    for suppression in suppressions {
        let disable_start = match suppression.disable_comment.start {
            Some(s) => s,
            None => continue,
        };

        // The suppression is within the function
        if disable_start > fn_start
            && (suppression.enable_comment.is_none()
                || suppression
                    .enable_comment
                    .as_ref()
                    .and_then(|c| c.end)
                    .map_or(false, |end| end < fn_end))
        {
            suppressions_in_scope.push(suppression);
        }

        // The suppression wraps the function
        if disable_start < fn_start
            && (suppression.enable_comment.is_none()
                || suppression
                    .enable_comment
                    .as_ref()
                    .and_then(|c| c.end)
                    .map_or(false, |end| end > fn_end))
        {
            suppressions_in_scope.push(suppression);
        }
    }

    suppressions_in_scope
}

/// Convert suppression ranges to a CompilerError.
pub fn suppressions_to_compiler_error(suppressions: &[SuppressionRange]) -> CompilerError {
    assert!(
        !suppressions.is_empty(),
        "Expected at least one suppression comment source range"
    );

    let mut error = CompilerError::new();

    for suppression in suppressions {
        let (disable_start, disable_end) = match (
            suppression.disable_comment.start,
            suppression.disable_comment.end,
        ) {
            (Some(s), Some(e)) => (s, e),
            _ => continue,
        };

        let (reason, suggestion) = match suppression.source {
            SuppressionSource::Eslint => (
                "React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled",
                "Remove the ESLint suppression and address the React error",
            ),
            SuppressionSource::Flow => (
                "React Compiler has skipped optimizing this component because one or more React rule violations were reported by Flow",
                "Remove the Flow suppression and address the React error",
            ),
        };

        let description = format!(
            "React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression `{}`",
            suppression.disable_comment.value.trim()
        );

        let mut diagnostic = CompilerDiagnostic::new(
            ErrorCategory::Suppression,
            reason,
            Some(description),
        );

        diagnostic.suggestions = Some(vec![CompilerSuggestion {
            description: suggestion.to_string(),
            range: (disable_start as usize, disable_end as usize),
            op: CompilerSuggestionOperation::Remove,
            text: None,
        }]);

        // Add error detail with location info
        let loc = suppression.disable_comment.loc.as_ref().map(|l| {
            react_compiler_diagnostics::SourceLocation {
                start: react_compiler_diagnostics::Position {
                    line: l.start.line,
                    column: l.start.column,
                },
                end: react_compiler_diagnostics::Position {
                    line: l.end.line,
                    column: l.end.column,
                },
            }
        });

        diagnostic = diagnostic.with_detail(CompilerDiagnosticDetail::Error {
            loc,
            message: Some("Found React rule suppression".to_string()),
        });

        error.push_diagnostic(diagnostic);
    }

    error
}
