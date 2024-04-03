/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use napi_derive::napi;
use react_diagnostics::Diagnostic;
use react_semantic_analysis::{analyze, AnalyzeOptions};

pub const GLOBALS: &[&str] = &[
    "AggregateError",
    "Array",
    "ArrayBuffer",
    "AsyncFunction",
    "AsyncGenerator",
    "AsyncGeneratorFunction",
    "AsyncIterator",
    "Atomics",
    "BigInt",
    "BigInt64Array",
    "BigUint64Array",
    "Boolean",
    "DataView",
    "Date",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "Error",
    "escape",
    "eval",
    "EvalError",
    "FinalizationRegistry",
    "Float32Array",
    "Float64Array",
    "Function",
    "Generator",
    "GeneratorFunction",
    "globalThis",
    "Infinity",
    "Int16Array",
    "Int32Array",
    "Int8Array",
    // "InternalError",  // non-standard
    "Intl",
    "isFinite",
    "isNaN",
    "Iterator",
    "JSON",
    "Map",
    "Math",
    "NaN",
    "Number",
    "Object",
    "parseFloat",
    "parseInt",
    "Promise",
    "Proxy",
    "RangeError",
    "ReferenceError",
    "Reflect",
    "RegExp",
    "Set",
    "SharedArrayBuffer",
    "String",
    "Symbol",
    "SyntaxError",
    "TypeError",
    "Uint16Array",
    "Uint32Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "undefined",
    "unescape",
    "URIError",
    "WeakMap",
    "WeakRef",
    "WeakSet",
];

#[napi]
pub fn parse(source: String, options: ParseOptions) -> ParseResult {
    let program = match react_hermes_parser::parse(&source, &options.file) {
        Ok(program) => program,
        Err(diagnostics) => {
            return ParseResult {
                program: None,
                diagnostics: convert_diagnostics(diagnostics),
            };
        }
    };
    let mut analysis = analyze(
        &program,
        AnalyzeOptions {
            globals: GLOBALS.iter().map(|s| s.to_string()).collect(),
        },
    );
    ParseResult {
        program: Some(serde_json::to_string(&program).unwrap()),
        diagnostics: convert_diagnostics(analysis.diagnostics()),
    }
}

fn convert_diagnostics(diagnostics: Vec<Diagnostic>) -> Vec<String> {
    diagnostics
        .into_iter()
        .map(|diagnostic| format!("{}", diagnostic))
        .collect()
}

#[napi(object)]
pub struct ParseOptions {
    pub file: String,
}

#[napi(object)]
pub struct ParseResult {
    pub program: Option<String>,
    pub diagnostics: Vec<String>,
}
