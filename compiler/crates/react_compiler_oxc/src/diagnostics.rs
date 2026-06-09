// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use oxc_diagnostics::OxcDiagnostic;
use react_compiler::entrypoint::compile_result::{
    CompileResult, CompilerErrorDetailInfo, LoggerEvent,
};

/// Converts a CompileResult into OXC diagnostics for display
pub fn compile_result_to_diagnostics(result: &CompileResult) -> Vec<OxcDiagnostic> {
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
            error,
            events,
            ..
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

fn error_info_to_diagnostic(error: &react_compiler::entrypoint::compile_result::CompilerErrorInfo) -> OxcDiagnostic {
    let message = format!("[ReactCompiler] {}", error.reason);
    let mut diag = OxcDiagnostic::error(message);

    if let Some(description) = &error.description {
        diag = diag.with_help(description.clone());
    }

    diag
}

fn error_detail_to_diagnostic(detail: &CompilerErrorDetailInfo, is_error: bool) -> OxcDiagnostic {
    let message = if let Some(description) = &detail.description {
        format!(
            "[ReactCompiler] {}: {}. {}",
            detail.category, detail.reason, description
        )
    } else {
        format!("[ReactCompiler] {}: {}", detail.category, detail.reason)
    };

    if is_error {
        OxcDiagnostic::error(message)
    } else {
        OxcDiagnostic::warn(message)
    }
}

fn event_to_diagnostic(event: &LoggerEvent) -> Option<OxcDiagnostic> {
    match event {
        LoggerEvent::CompileSuccess { .. } => None,
        LoggerEvent::CompileSkip { .. } => None,
        LoggerEvent::CompileError { detail, .. }
        | LoggerEvent::CompileErrorWithLoc { detail, .. } => {
            Some(error_detail_to_diagnostic(detail, false))
        }
        LoggerEvent::CompileUnexpectedThrow { data, .. } => {
            Some(OxcDiagnostic::error(format!(
                "[ReactCompiler] Unexpected error: {}",
                data
            )))
        }
        LoggerEvent::PipelineError { data, .. } => {
            Some(OxcDiagnostic::error(format!(
                "[ReactCompiler] Pipeline error: {}",
                data
            )))
        }
    }
}
