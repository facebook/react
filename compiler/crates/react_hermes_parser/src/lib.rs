/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

mod generated;
mod generated_extension;

use generated_extension::{Context, FromHermes};
use hermes::parser::{HermesParser, ParserDialect, ParserFlags};
use hermes::utf::utf8_with_surrogates_to_string;
use juno_support::NullTerminatedBuf;
use react_diagnostics::Diagnostic;
use react_estree::Program;

pub fn parse(source: &str, _file: &str) -> Result<Program, Vec<Diagnostic>> {
    let buf = NullTerminatedBuf::from_str_check(source);
    let result = HermesParser::parse(
        ParserFlags {
            dialect: ParserDialect::TypeScript,
            enable_jsx: true,
            store_doc_block: true,
            strict_mode: true,
        },
        &buf,
    );
    let mut cx = Context::new(&buf);
    if result.has_errors() {
        let error_messages = result.messages();
        return Err(error_messages
            .iter()
            .map(|diag| {
                let message = utf8_with_surrogates_to_string(diag.message.as_slice()).unwrap();
                Diagnostic::invalid_syntax(message, None)
            })
            .collect());
    }

    Ok(FromHermes::convert(&mut cx, result.root().unwrap()))
}
