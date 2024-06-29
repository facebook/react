/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::cell::RefCell;
use std::rc::Rc;

use indexmap::{IndexMap, IndexSet};
use react_diagnostics::Diagnostic;
use react_hir::{
    BasicBlock, BlockId, BlockRewriter, BlockRewriterAction, Blocks, Environment, Function,
    Identifier, IdentifierData, IdentifierId, IdentifierOperand, InstructionValue, MutableRange,
    Phi, HIR,
};

pub fn enter_ssa(env: &Environment, fun: &mut Function) -> Result<(), Diagnostic> {
    assert!(fun.context.is_empty());
    enter_ssa_impl(env, fun, None)
}

pub fn enter_ssa_impl(
    env: &Environment,
    fun: &mut Function,
    context_defs: Option<IndexMap<IdentifierId, Identifier>>,
) -> Result<(), Diagnostic> {
    let mut builder = Builder::new(env, fun.body.entry, &fun.body.blocks);
    if let Some(context_defs) = context_defs {
        builder.initialize_context(context_defs);
    }
    for param in &mut fun.params {
        builder.visit_param(param);
    }
    visit_instructions(env, &mut builder, &mut fun.body)?;

    let mut states = builder.complete();

    for block in fun.body.blocks.iter_mut() {
        let state = states.remove(&block.id).unwrap();
        block.phis = state.phis;
    }

    Ok(())
}

fn visit_instructions(
    env: &Environment,
    builder: &mut Builder<'_>,
    hir: &mut HIR,
) -> Result<(), Diagnostic> {
    let instructions = &mut hir.instructions;
    let blocks = &mut hir.blocks;
    let mut rewriter = BlockRewriter::new(blocks, hir.entry);

    rewriter.try_each_block(|mut block, _rewriter| {
        builder.start_block(&block);
        for instr_ix in &block.instructions {
            let instr = &mut instructions[usize::from(*instr_ix)];
            instr.each_rvalue(|rvalue| builder.visit_load(rvalue));
            instr.try_each_lvalue(|lvalue| builder.visit_store(lvalue))?;

            if let InstructionValue::Function(fun) = &mut instr.value {
                // Lookup each of the context variables referenced in the function
                // against the current block. Note that variables which are reassigned somewhere
                // and referenced in a function expression are always promoted to LoadContext
                // so the context variables are all guaranteed to be const. We're just remapping
                // the id along w the original declaration and other usages.
                let context_defs: IndexMap<IdentifierId, Identifier> = fun
                    .lowered_function
                    .context
                    .iter_mut()
                    .map(|identifier| {
                        let old_id = identifier.identifier.id;
                        builder.visit_load(identifier);
                        (old_id, identifier.identifier.clone())
                    })
                    .collect();
                enter_ssa_impl(env, &mut fun.lowered_function, Some(context_defs))?;
            }
        }
        block
            .terminal
            .value
            .each_operand(|load| builder.visit_load(load));
        builder.close_block(&block);
        Ok(BlockRewriterAction::Keep(block))
    })
}

#[derive(Debug)]
struct Builder<'e> {
    env: &'e Environment,
    predecessors: IndexMap<BlockId, IndexSet<BlockId>>,

    states: IndexMap<BlockId, BlockState>,
    current: BlockId,
    unsealed_predecessors: IndexMap<BlockId, usize>,
    unknown: IndexSet<IdentifierId>,
    context: IndexSet<IdentifierId>,
    visited: IndexSet<BlockId>,
}

#[derive(Debug)]
struct BlockState {
    defs: IndexMap<IdentifierId, Identifier>,
    incomplete_phis: Vec<IncompletePhi>,
    phis: Vec<Phi>,
}

impl BlockState {
    fn new() -> Self {
        Self {
            defs: Default::default(),
            incomplete_phis: Default::default(),
            phis: Default::default(),
        }
    }
}

#[derive(Debug)]
struct IncompletePhi {
    old_id: Identifier,
    new_id: Identifier,
}

impl<'e> Builder<'e> {
    fn new(env: &'e Environment, entry: BlockId, blocks: &Blocks) -> Self {
        let states = blocks
            .block_ids()
            .into_iter()
            .map(|block_id| (block_id, BlockState::new()))
            .collect();
        let predecessors = blocks
            .iter()
            .map(|block| (block.id, block.predecessors.clone()))
            .collect();
        Self {
            env,
            predecessors,
            states,
            current: entry,
            unsealed_predecessors: Default::default(),
            unknown: Default::default(),
            context: Default::default(),
            visited: Default::default(),
        }
    }

    fn initialize_context(&mut self, defs: IndexMap<IdentifierId, Identifier>) {
        let state = self.states.get_mut(&self.current).unwrap();
        state.defs = defs;
    }

    fn complete(self) -> IndexMap<BlockId, BlockState> {
        self.states
    }

    fn next_ssa_id(&self) -> IdentifierId {
        self.env.next_identifier_id()
    }

    fn visit_store(&mut self, lvalue: &mut IdentifierOperand) -> Result<(), Diagnostic> {
        let old_identifier = &lvalue.identifier;
        if self.unknown.contains(&old_identifier.id) {
            return Err(Diagnostic::invariant(
                "EnterSSA: Expected identifier to be defined before being used",
                None,
            ));
        }
        if self.context.contains(&old_identifier.id) {
            let new_identifier = self.get_id_at(self.current, old_identifier);
            lvalue.identifier = new_identifier;
            return Ok(());
        }

        let new_identifier = self.make_identifier(old_identifier);
        let state = self.states.get_mut(&self.current).unwrap();
        state.defs.insert(old_identifier.id, new_identifier.clone());
        lvalue.identifier = new_identifier;
        Ok(())
    }

    fn visit_param(&mut self, param: &mut IdentifierOperand) {
        let old_identifier = &param.identifier;
        let new_identifier = self.make_identifier(old_identifier);
        let state = self.states.get_mut(&self.current).unwrap();
        state.defs.insert(old_identifier.id, new_identifier.clone());
        param.identifier = new_identifier;
    }

    fn visit_load(&mut self, local: &mut IdentifierOperand) {
        let new_identifier = self.get_id_at(self.current, &local.identifier);
        local.identifier = new_identifier;
    }

    fn get_id_at(&mut self, block_id: BlockId, old_identifier: &Identifier) -> Identifier {
        // Check if we've already resolved this identifier in this block
        let state = self.states.get(&block_id).unwrap();
        if let Some(identifier) = state.defs.get(&old_identifier.id) {
            return identifier.clone();
        }
        // Else we have to look at predecessor blocks: bail if no predecessors
        let predecessors = self.predecessors.get(&block_id).unwrap();
        if predecessors.is_empty() {
            panic!("Unable to find previous id for {old_identifier:?}");
            // self.unknown.insert(old_identifier.id);
            // return old_identifier.clone();
        }
        // If we haven't visited all predecessors, synthesize a new identifier
        // and save it as an incomplete phi
        if self.unsealed_predecessors.get(&block_id).cloned().unwrap() > 0 {
            let new_identifier = self.make_identifier(old_identifier);
            let state = self.states.get_mut(&block_id).unwrap();
            state.incomplete_phis.push(IncompletePhi {
                old_id: old_identifier.clone(),
                new_id: new_identifier.clone(),
            });
            state.defs.insert(old_identifier.id, new_identifier.clone());
            return new_identifier;
        }
        // If exactly one predecessor, check to see if we have a definition there
        if predecessors.len() == 1 {
            let predecessor = predecessors.first().unwrap();
            let new_identifier = self.get_id_at(*predecessor, old_identifier);
            let state = self.states.get_mut(&block_id).unwrap();
            state.defs.insert(old_identifier.id, new_identifier.clone());
            return new_identifier;
        }
        // There are multiple predecessors, we may need a phi
        let new_identifier = self.make_identifier(old_identifier);
        let state = self.states.get_mut(&block_id).unwrap();
        state.defs.insert(old_identifier.id, new_identifier.clone());
        self.add_phi(block_id, old_identifier, new_identifier)
    }

    fn add_phi(
        &mut self,
        block_id: BlockId,
        old_identifier: &Identifier,
        new_identifier: Identifier,
    ) -> Identifier {
        let mut phi = Phi {
            identifier: new_identifier.clone(),
            operands: Default::default(),
        };
        // TODO: avoid clone here
        let predecessors = self.predecessors.get(&block_id).unwrap().clone();
        for pred_block_id in predecessors {
            let pred_id = self.get_id_at(pred_block_id, old_identifier);
            phi.operands.insert(pred_block_id, pred_id);
        }
        let state = self.states.get_mut(&block_id).unwrap();
        state.phis.push(phi);
        new_identifier
    }

    fn make_identifier(&self, old_identifier: &Identifier) -> Identifier {
        let old_data = old_identifier.data.borrow();
        Identifier {
            id: self.next_ssa_id(),
            name: old_identifier.name.clone(),
            data: Rc::new(RefCell::new(IdentifierData {
                mutable_range: MutableRange::new(),
                scope: None,
                type_: old_data.type_.clone(),
            })),
        }
    }

    fn fix_incomplete_phis(&mut self, block_id: BlockId) {
        let state = self.states.get_mut(&block_id).unwrap();
        let incomplete_phis = std::mem::take(&mut state.incomplete_phis);
        for phi in incomplete_phis {
            self.add_phi(block_id, &phi.old_id, phi.new_id);
        }
    }

    fn start_block(&mut self, block: &BasicBlock) {
        self.current = block.id;
        self.visited.insert(block.id);
    }

    fn close_block(&mut self, block: &BasicBlock) {
        let successors = block.terminal.value.successors();
        for successor in successors {
            let preds = &self.predecessors.get(&successor).unwrap();
            let count = self
                .unsealed_predecessors
                .entry(successor)
                .or_insert(preds.len());
            *count -= 1;
            if *count == 0 && self.visited.contains(&successor) {
                self.fix_incomplete_phis(successor)
            }
        }
    }
}
