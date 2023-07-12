use std::{cell::RefCell, rc::Rc};

use bumpalo::collections::{CollectIn, Vec};
use hir::{
    BasicBlock, BlockId, Blocks, Environment, Function, Identifier, IdentifierData, IdentifierId,
    IdentifierOperand, Instruction, LValue, MutableRange, Phi, HIR,
};
use indexmap::{IndexMap, IndexSet};
use thiserror::Error;

#[derive(Error, Debug)]
#[error("Error constructing SSA form")]
pub struct SSAError;

pub fn enter_ssa<'a>(env: &Environment<'a>, fun: &mut Function<'a>) -> Result<(), SSAError> {
    let blocks = &fun.body.blocks;
    let instructions = &mut fun.body.instructions;
    let mut builder = Builder::new(env, fun.body.entry, blocks);
    for param in &mut fun.params {
        builder.visit_param(param);
    }
    enter_ssa_impl(&mut builder, instructions)?;

    let mut states = builder.complete();

    for block in fun.body.blocks.values_mut() {
        let state = states.remove(&block.id).unwrap();
        block.phis = state.phis;
    }

    Ok(())
}

fn enter_ssa_impl<'a, 'e, 'f>(
    builder: &mut Builder<'a, 'e, 'f>,
    instructions: &mut Vec<'a, Instruction<'a>>,
) -> Result<(), SSAError> {
    builder.each_block(|block, builder| {
        for instr_ix in &block.instructions {
            let instr = &mut instructions[usize::from(*instr_ix)];
            instr.each_identifier_store(|store| builder.visit_store(store));
            instr.each_identifier_load(|load| builder.visit_load(load));
        }
    });
    Ok(())
}

#[derive(Debug)]
struct Builder<'a, 'e, 'f> {
    env: &'e Environment<'a>,
    blocks: &'f Blocks<'a>,

    states: IndexMap<BlockId, BlockState<'a>>,
    current: BlockId,
    unsealed_predecessors: IndexMap<BlockId, usize>,
    unknown: IndexSet<IdentifierId>,
    context: IndexSet<IdentifierId>,
}

#[derive(Debug)]
struct BlockState<'a> {
    defs: IndexMap<IdentifierId, Identifier<'a>>,
    incomplete_phis: Vec<'a, IncompletePhi<'a>>,
    phis: Vec<'a, Phi<'a>>,
}

impl<'a> BlockState<'a> {
    fn new(env: &Environment<'a>) -> Self {
        Self {
            defs: Default::default(),
            incomplete_phis: Vec::new_in(&env.allocator),
            phis: Vec::new_in(&env.allocator),
        }
    }
}

#[derive(Debug)]
struct IncompletePhi<'a> {
    old_id: Identifier<'a>,
    new_id: Identifier<'a>,
}

impl<'a, 'e, 'f> Builder<'a, 'e, 'f> {
    fn new(env: &'e Environment<'a>, entry: BlockId, blocks: &'f Blocks<'a>) -> Self {
        let states = blocks
            .keys()
            .map(|block_id| (*block_id, BlockState::new(env)))
            .collect();
        Self {
            env,
            blocks,
            states,
            current: entry,
            unsealed_predecessors: Default::default(),
            unknown: Default::default(),
            context: Default::default(),
        }
    }

    fn complete(self) -> IndexMap<BlockId, BlockState<'a>> {
        self.states
    }

    fn next_ssa_id(&self) -> IdentifierId {
        self.env.next_identifier_id()
    }

    fn visit_store(&mut self, lvalue: &mut LValue<'a>) -> () {
        let old_identifier = &lvalue.identifier.identifier;
        // TODO: use Result (?)
        assert!(!self.unknown.contains(&old_identifier.id), "EnterSSA: Expected identifier to be defined before being used. Identifier {old_identifier:?} is undefined.");

        if self.context.contains(&old_identifier.id) {
            let new_identifier = self.get_id_at(self.current, old_identifier);
            lvalue.identifier.identifier = new_identifier;
            return;
        }

        let new_identifier = self.make_identifier(old_identifier);
        let state = self.states.get_mut(&self.current).unwrap();
        state.defs.insert(old_identifier.id, new_identifier.clone());
        lvalue.identifier.identifier = new_identifier;
    }

    fn visit_param(&mut self, param: &mut IdentifierOperand<'a>) -> () {
        let old_identifier = &param.identifier;
        let new_identifier = self.make_identifier(old_identifier);
        let state = self.states.get_mut(&self.current).unwrap();
        state.defs.insert(old_identifier.id, new_identifier.clone());
        param.identifier = new_identifier;
    }

    fn visit_load(&mut self, local: &mut IdentifierOperand<'a>) -> () {
        let new_identifier = self.get_id_at(self.current, &local.identifier);
        local.identifier = new_identifier;
    }

    fn get_id_at(&mut self, block_id: BlockId, old_identifier: &Identifier<'a>) -> Identifier<'a> {
        // Check if we've already resolved this identifier in this block
        let state = self.states.get(&block_id).unwrap();
        if let Some(identifier) = state.defs.get(&old_identifier.id) {
            return identifier.clone();
        }
        // Else we have to look at predecessor blocks: bail if no predecessors
        let block = self.blocks.get(&block_id).unwrap();
        if block.predecessors.is_empty() {
            println!("Unable to find previous id for {old_identifier:?}");
            self.unknown.insert(old_identifier.id);
            return old_identifier.clone();
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
        if block.predecessors.len() == 1 {
            let predecessor = block.predecessors.iter().next().unwrap();
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
        old_identifier: &Identifier<'a>,
        new_identifier: Identifier<'a>,
    ) -> Identifier<'a> {
        let mut phi = Phi {
            identifier: new_identifier.clone(),
            operands: Default::default(),
        };
        let block = self.blocks.get(&block_id).unwrap();
        let preds = block.predecessors.clone();
        for pred_block_id in preds {
            let pred_id = self.get_id_at(pred_block_id, old_identifier);
            phi.operands.insert(pred_block_id, pred_id);
        }
        let state = self.states.get_mut(&block_id).unwrap();
        state.phis.push(phi);
        new_identifier
    }

    fn make_identifier(&self, old_identifier: &Identifier<'a>) -> Identifier<'a> {
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

    fn fix_incomplete_phis(&mut self, block_id: BlockId) -> () {
        let state = self.states.get_mut(&block_id).unwrap();
        let incomplete_phis =
            std::mem::replace(&mut state.incomplete_phis, Vec::new_in(&self.env.allocator));
        for phi in incomplete_phis {
            self.add_phi(block_id, &phi.old_id, phi.new_id);
        }
    }

    fn each_block<F>(&mut self, mut f: F) -> ()
    where
        F: FnMut(&BasicBlock<'a>, &mut Self) -> (),
    {
        let mut visited = IndexSet::new();
        let block_ids: Vec<_> = self.blocks.keys().cloned().collect_in(self.env.allocator);
        for block_id in block_ids {
            visited.insert(block_id);
            self.current = block_id;
            let block = self.blocks.get(&block_id).unwrap();
            f(block, self);
            let successors = block.terminal.value.successors();
            for successor in successors {
                let block = self.blocks.get(&successor).unwrap();
                let count = self
                    .unsealed_predecessors
                    .get(&successor)
                    .cloned()
                    .unwrap_or(block.predecessors.len())
                    - 1;
                self.unsealed_predecessors.insert(successor, count);
                if count == 0 && visited.contains(&successor) {
                    self.fix_incomplete_phis(successor)
                }
            }
        }
    }
}
