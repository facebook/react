mod generated;
mod generated_extension;

use forget_diagnostics::Diagnostic;
use forget_estree::Program;
use generated_extension::{Context, FromHermes};
use hermes::parser::{HermesParser, ParserDialect, ParserFlags};
use hermes::utf::utf8_with_surrogates_to_string;
use juno_support::NullTerminatedBuf;

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
    let mut cx = Context::new();
    if result.has_errors() {
        let error_messages = result.messages();
        return Err(error_messages
            .into_iter()
            .map(|diag| {
                let message = utf8_with_surrogates_to_string(diag.message.as_slice()).unwrap();
                Diagnostic::invalid_syntax(message, None)
            })
            .collect());
    }

    Ok(FromHermes::convert(&mut cx, result.root().unwrap()))
}
