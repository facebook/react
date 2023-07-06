use std::collections::HashMap;

use hir::{BasicBlock, BlockId, Environment};

/// Helper struct used when converting from ESTree to HIR. Includes:
/// - Variable resolution
/// - Label resolution (for labeled statements and break/continue)
/// - Access to the environment
///
/// As well as representing the incomplete form of the HIR. Usage
/// generally involves driving calls to enter/exit blocks, resolve
/// labels and variables, and then calling `build()` when the HIR
/// is complete.
pub struct Builder<'a> {
    environment: &'a Environment<'a>,
    completed: HashMap<BlockId, BasicBlock<'a>>,
    entry: BlockId,
}
