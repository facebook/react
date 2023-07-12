use std::collections::{HashMap, HashSet};

use hir::{BlockId, Environment, Function, Identifier, IdentifierId, HIR};
use utils::RetainMut;

/// Pass to eliminate redundant phi nodes:
/// all operands are the same identifier, ie `x2 = phi(x1, x1, x1)`.
/// all operands are the same identifier *or* the output of the phi, ie `x2 = phi(x1, x2, x1, x2)`.
///
/// In both these cases, the phi is eliminated and all usages of the phi identifier
/// are replaced with the other operand (ie in both cases above, all usages of `x2` are replaced with `x1` .
///
/// The algorithm is inspired by that in https://pp.info.uni-karlsruhe.de/uploads/publikationen/braun13cc.pdf
/// but modified to reduce passes over the CFG. We visit the blocks in reverse postorder. Each time a redundant
/// phi is encountered we add a mapping (eg x2 -> x1) to a rewrite table. Subsequent instructions, terminals,
/// and phis rewrite all their identifiers based on this table. The algorithm loops over the CFG repeatedly
/// until there are no new rewrites: for a CFG without back-edges it completes in a single pass.
type Rewrites<'a> = HashMap<IdentifierId, Identifier<'a>>;
pub fn eliminate_redundant_phis<'a>(_env: &'a Environment, fun: &mut Function<'a>) {
    let hir = &mut fun.body;
    let mut rewrites = Rewrites::new();

    let mut has_back_edge = false;
    let mut visited = HashSet::<BlockId>::new();

    let mut len;
    loop {
        len = rewrites.len();

        for (_, block) in hir.blocks.iter_mut() {
            if !has_back_edge {
                for predecessor in block.predecessors.iter() {
                    if !visited.contains(predecessor) {
                        has_back_edge = true;
                    }
                }
            }
            visited.insert(block.id);

            block.phis.retain_mut(|phi| {
                // Remap operands in case they are from eliminated phis
                for (_, operand) in phi.operands.iter_mut() {
                    rewrite(&rewrites, operand);
                }
                // Find if the phi can be eliminated
                let mut rewrite: Option<Identifier> = None;
                for (_, operand) in phi.operands.iter() {
                    if operand.id == phi.identifier.id {
                        // This operand is the same as the phi itself
                        continue;
                    }
                    match &rewrite {
                        Some(rewrite) if rewrite.id == operand.id => {
                            // this operand is the same as the other operands
                            continue;
                        }
                        Some(_) => {
                            // There are multiple operands not equal to the phi itself,
                            // the phi cannot be eliminated (true to retain the phi)
                            return true;
                        }
                        None => {
                            rewrite = Some(operand.clone());
                        }
                    }
                }
                rewrites.insert(phi.identifier.id, rewrite.unwrap());
                // The phi can be eliminated (false to not retain)
                false
            });

            for instr_ix in block.instructions.iter() {
                let instr = &mut hir.instructions[usize::from(*instr_ix)];
                instr.each_identifier_store(|store| {
                    rewrite(&rewrites, &mut store.identifier.identifier)
                });
                instr.each_identifier_load(|load| rewrite(&rewrites, &mut load.identifier));
            }
        }

        // We only need to loop if there were newly eliminated phis in this iteration
        // *and* the CFG has loops. If there are no loops then all eliminated phis must
        // have been propagated forwards since we visit in RPO
        if has_back_edge && rewrites.len() > len {
            continue;
        } else {
            break;
        }
    }
}

fn rewrite<'a>(rewrites: &Rewrites<'a>, identifier: &mut Identifier<'a>) {
    if let Some(rewrite) = rewrites.get(&identifier.id) {
        *identifier = rewrite.clone()
    }
}
