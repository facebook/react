use react_compiler_ast::{File, scope::ScopeInfo};
use crate::environment::Environment;
use crate::hir::HirFunction;

pub fn lower(_ast: File, _scope: ScopeInfo, _env: &mut Environment) -> Result<HirFunction, String> {
    todo!("lower not yet implemented")
}
