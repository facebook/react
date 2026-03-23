// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use react_compiler::entrypoint::compile_result::{
    CompileResult, CompilerErrorDetailInfo, CompilerErrorInfo, LoggerEvent,
};

#[derive(Debug, Clone)]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Clone)]
pub struct DiagnosticMessage {
    pub severity: Severity,
    pub message: String,
    pub span: Option<(u32, u32)>,
}

/// Converts a CompileResult into diagnostic messages for display
pub fn compile_result_to_diagnostics(result: &CompileResult) -> Vec<DiagnosticMessage> {
    let mut diagnostics = Vec::new();

    match result {
        CompileResult::Success { events, .. } => {
            // Process logger events from successful compilation
            for event in events {
                if let Some(diag) = event_to_diagnostic(event) {
                    diagnostics.push(diag);
                }
            }
        }
        CompileResult::Error {
            error, events, ..
        } => {
            // Add the main error
            diagnostics.push(error_info_to_diagnostic(error));

            // Process logger events from failed compilation
            for event in events {
                if let Some(diag) = event_to_diagnostic(event) {
                    diagnostics.push(diag);
                }
            }
        }
    }

    diagnostics
}

fn error_info_to_diagnostic(error: &CompilerErrorInfo) -> DiagnosticMessage {
    let message = if let Some(description) = &error.description {
        format!("[ReactCompiler] {}. {}", error.reason, description)
    } else {
        format!("[ReactCompiler] {}", error.reason)
    };

    DiagnosticMessage {
        severity: Severity::Error,
        message,
        span: None,
    }
}

fn error_detail_to_diagnostic(detail: &CompilerErrorDetailInfo, is_error: bool) -> DiagnosticMessage {
    let message = if let Some(description) = &detail.description {
        format!(
            "[ReactCompiler] {}: {}. {}",
            detail.category, detail.reason, description
        )
    } else {
        format!("[ReactCompiler] {}: {}", detail.category, detail.reason)
    };

    DiagnosticMessage {
        severity: if is_error {
            Severity::Error
        } else {
            Severity::Warning
        },
        message,
        span: None,
    }
}

fn event_to_diagnostic(event: &LoggerEvent) -> Option<DiagnosticMessage> {
    match event {
        LoggerEvent::CompileSuccess { .. } => None,
        LoggerEvent::CompileSkip { .. } => None,
        LoggerEvent::CompileError { detail, .. } => {
            Some(error_detail_to_diagnostic(detail, false))
        }
        LoggerEvent::CompileUnexpectedThrow { data, .. } => Some(DiagnosticMessage {
            severity: Severity::Error,
            message: format!("[ReactCompiler] Unexpected error: {}", data),
            span: None,
        }),
        LoggerEvent::PipelineError { data, .. } => Some(DiagnosticMessage {
            severity: Severity::Error,
            message: format!("[ReactCompiler] Pipeline error: {}", data),
            span: None,
        }),
    }
}
