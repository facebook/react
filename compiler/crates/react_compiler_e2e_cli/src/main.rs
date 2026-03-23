// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! CLI for end-to-end testing of the React Compiler via SWC or OXC frontends.
//!
//! Reads source from stdin, compiles via the chosen frontend, writes compiled
//! code to stdout. Errors go to stderr. Exit 0 = success, exit 1 = error.
//!
//! Usage:
//!   react-compiler-e2e --frontend <swc|oxc> --filename <path> [--options <json>]

use clap::Parser;
use react_compiler::entrypoint::plugin_options::PluginOptions;
use std::io::Read;
use std::process;

#[derive(Parser)]
#[command(name = "react-compiler-e2e")]
struct Cli {
    /// Frontend to use: "swc" or "oxc"
    #[arg(long)]
    frontend: String,

    /// Filename (used to determine source type from extension)
    #[arg(long)]
    filename: String,

    /// JSON-serialized PluginOptions
    #[arg(long)]
    options: Option<String>,
}

fn main() {
    let cli = Cli::parse();

    // Read source from stdin
    let mut source = String::new();
    std::io::stdin().read_to_string(&mut source).unwrap_or_else(|e| {
        eprintln!("Failed to read stdin: {e}");
        process::exit(1);
    });

    // Parse options — merge provided JSON over sensible defaults
    let default_json = r#"{"shouldCompile":true,"enableReanimated":false,"isDev":false}"#;
    let options: PluginOptions = if let Some(ref json) = cli.options {
        // Merge: start with defaults, override with provided values
        let mut base: serde_json::Value = serde_json::from_str(default_json).unwrap();
        let overrides: serde_json::Value = serde_json::from_str(json).unwrap_or_else(|e| {
            eprintln!("Failed to parse options JSON: {e}");
            process::exit(1);
        });
        if let (serde_json::Value::Object(b), serde_json::Value::Object(o)) =
            (&mut base, overrides)
        {
            for (k, v) in o {
                b.insert(k, v);
            }
        }
        serde_json::from_value(base).unwrap_or_else(|e| {
            eprintln!("Failed to deserialize merged options: {e}");
            process::exit(1);
        })
    } else {
        serde_json::from_str(default_json).unwrap()
    };

    let result = match cli.frontend.as_str() {
        "swc" => compile_swc(&source, &cli.filename, options),
        "oxc" => compile_oxc(&source, &cli.filename, options),
        other => {
            eprintln!("Unknown frontend: {other}. Use 'swc' or 'oxc'.");
            process::exit(1);
        }
    };

    match result {
        Ok(code) => {
            print!("{code}");
        }
        Err(e) => {
            eprintln!("{e}");
            process::exit(1);
        }
    }
}

fn determine_swc_syntax(filename: &str) -> swc_ecma_parser::Syntax {
    let is_tsx = filename.ends_with(".tsx");
    let is_ts = filename.ends_with(".ts") || is_tsx;
    let is_jsx = filename.ends_with(".jsx") || is_tsx;

    if is_ts {
        swc_ecma_parser::Syntax::Typescript(swc_ecma_parser::TsSyntax {
            tsx: is_tsx,
            ..Default::default()
        })
    } else {
        swc_ecma_parser::Syntax::Es(swc_ecma_parser::EsSyntax {
            jsx: is_jsx || filename.ends_with(".js"),
            ..Default::default()
        })
    }
}

fn compile_swc(source: &str, filename: &str, options: PluginOptions) -> Result<String, String> {
    let cm = swc_common::sync::Lrc::new(swc_common::SourceMap::default());
    let fm = cm.new_source_file(
        swc_common::sync::Lrc::new(swc_common::FileName::Anon),
        source.to_string(),
    );

    let syntax = determine_swc_syntax(filename);
    let mut errors = vec![];
    let module = swc_ecma_parser::parse_file_as_module(
        &fm,
        syntax,
        swc_ecma_ast::EsVersion::latest(),
        None,
        &mut errors,
    )
    .map_err(|e| format!("SWC parse error: {e:?}"))?;

    if !errors.is_empty() {
        return Err(format!("SWC parse errors: {errors:?}"));
    }

    let result = react_compiler_swc::transform(&module, source, options);

    match result.module {
        Some(compiled_module) => Ok(react_compiler_swc::emit(&compiled_module)),
        None => {
            // No changes needed — emit the original module
            Ok(react_compiler_swc::emit(&module))
        }
    }
}

fn compile_oxc(source: &str, filename: &str, options: PluginOptions) -> Result<String, String> {
    let source_type = oxc_span::SourceType::from_path(filename)
        .unwrap_or_default();

    let allocator = oxc_allocator::Allocator::default();
    let parsed = oxc_parser::Parser::new(&allocator, source, source_type).parse();

    if parsed.panicked || !parsed.errors.is_empty() {
        let err_msgs: Vec<String> = parsed.errors.iter().map(|e| e.to_string()).collect();
        return Err(format!("OXC parse errors: {}", err_msgs.join("; ")));
    }

    let semantic = oxc_semantic::SemanticBuilder::new()
        .build(&parsed.program)
        .semantic;

    let result = react_compiler_oxc::transform(&parsed.program, &semantic, source, options);

    match result.program_json {
        Some(json) => {
            let file: react_compiler_ast::File = serde_json::from_value(json)
                .map_err(|e| format!("Failed to deserialize compiler output: {e}"))?;
            let emit_allocator = oxc_allocator::Allocator::default();
            Ok(react_compiler_oxc::emit(&file, &emit_allocator))
        }
        None => {
            // No changes — emit the original parsed program
            Ok(oxc_codegen::Codegen::new().build(&parsed.program).code)
        }
    }
}
