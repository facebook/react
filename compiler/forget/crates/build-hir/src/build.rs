use estree::FunctionDeclaration;
use hir::{Environment, Function};

use crate::builder::Builder;

/// Converts a React function in ESTree format into HIR. Returns the HIR
/// if it was constructed sucessfully, otherwise a list of diagnostics
/// if the input could be not be converted to HIR.
///
/// Failures generally include nonsensical input (`delete 1`) or syntax
/// that is not yet supported.
pub fn build<'a>(
    environment: &'a Environment<'a>,
    fun: FunctionDeclaration,
) -> Result<Function<'a>, Vec<()>> {
    let mut builder = Builder::new(environment);

    let body = match builder.build() {
        Ok(body) => body,
        Err(diagnostic) => return Err(vec![diagnostic]),
    };

    Ok(Function {
        body,
        is_async: fun.is_async,
        is_generator: fun.is_generator,
    })
}
