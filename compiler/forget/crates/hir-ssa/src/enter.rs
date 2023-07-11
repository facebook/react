use std::collections::HashSet;

use hir::{BlockId, Environment, Function, HIR};
use thiserror::Error;

#[derive(Error, Debug)]
#[error("Error constructing SSA form")]
pub struct SSAError;

pub fn enter_ssa<'a>(env: &'a Environment<'a>, hir: &mut Function<'a>) -> Result<(), SSAError> {
    let mut builder = Builder::new(env);
    enter_ssa_impl(&mut builder, hir, hir.body.entry)
}

struct Builder<'a> {
    env: &'a Environment<'a>,
}

impl<'a> Builder<'a> {
    fn new(env: &'a Environment<'a>) -> Self {
        Self { env }
    }
}

fn enter_ssa_impl<'a>(
    builder: &mut Builder<'a>,
    hir: &mut Function<'a>,
    root_block_id: BlockId,
) -> Result<(), SSAError> {
    let mut visited = HashSet::with_capacity(hir.body.blocks.len());
    for (block_id, block) in hir.body.blocks.iter_mut() {
        if !visited.insert(*block_id) {
            // Visited the same block twice
            return Err(SSAError);
        }
    }
    Ok(())
}
