/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use indexmap::IndexMap;
use react_diagnostics::Diagnostic;

use crate::{BasicBlock, BlockId, FunctionExpression, IdentifierOperand, InstrIx, Instruction};

/// Represents either a React function or a function expression
#[derive(Debug)]
pub struct Function {
    pub id: Option<String>,
    pub body: HIR,
    pub params: Vec<IdentifierOperand>,
    pub context: Vec<IdentifierOperand>,
    pub is_async: bool,
    pub is_generator: bool,
}

/// Represents the body of a `Function` as a control-flow graph.
/// Blocks are stored in reverse postorder (predecessors before successors)
/// so that compiler passes can complete forward data flow analysis in a
/// single pass over the CFG in the case where there are no loops.
#[derive(Debug)]
pub struct HIR {
    /// The id of the first block
    pub entry: BlockId,

    /// Blocks are stored in a map for easy retrieval by their id,
    /// but the blocks are in reverse postorder
    pub blocks: Blocks,

    /// All instructions for the block. This may contain unused items,
    pub instructions: Vec<Instruction>,
}

impl HIR {
    pub fn inline(&mut self, other: FunctionExpression) {
        let offset = self.instructions.len();
        for instr in other.lowered_function.body.instructions.into_iter() {
            self.instructions.push(instr);
        }
        for mut block in other.lowered_function.body.blocks.into_iter() {
            for ix in block.instructions.iter_mut() {
                *ix = InstrIx::new((offset + usize::from(*ix)) as u32);
            }
            self.blocks.insert(block);
        }
    }
}

#[derive(Default, Debug)]
pub struct Blocks {
    data: IndexMap<BlockId, Option<Box<BasicBlock>>>,
}

impl Blocks {
    pub fn new() -> Self {
        Self {
            data: Default::default(),
        }
    }

    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            data: IndexMap::with_capacity(capacity),
        }
    }

    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn insert(&mut self, block: Box<BasicBlock>) -> Option<Option<Box<BasicBlock>>> {
        self.data.insert(block.id, Some(block))
    }

    pub fn block_ids(&self) -> std::vec::Vec<BlockId> {
        self.data.keys().cloned().collect()
    }

    pub fn remove(&mut self, id: BlockId) -> Box<BasicBlock> {
        self.data.remove(&id).unwrap().unwrap()
    }

    pub fn extend(&mut self, other: Self) {
        self.data.extend(other.data);
    }

    pub fn into_iter(self) -> BlocksIntoIter {
        BlocksIntoIter::new(self.data.into_iter())
    }

    pub fn block(&self, id: BlockId) -> &BasicBlock {
        self.data.get(&id).unwrap().as_ref().unwrap()
    }

    pub fn block_mut(&mut self, id: BlockId) -> &mut BasicBlock {
        self.data.get_mut(&id).unwrap().as_mut().unwrap()
    }

    pub fn iter(&self) -> BlocksIter<'_> {
        BlocksIter::new(self.data.iter())
    }

    pub fn iter_mut(&mut self) -> BlocksIterMut<'_> {
        BlocksIterMut::new(self.data.iter_mut())
    }
}
pub struct BlocksIntoIter {
    iter: indexmap::map::IntoIter<BlockId, Option<Box<BasicBlock>>>,
}

impl BlocksIntoIter {
    fn new(iter: indexmap::map::IntoIter<BlockId, Option<Box<BasicBlock>>>) -> Self {
        Self { iter }
    }
}

impl Iterator for BlocksIntoIter {
    type Item = Box<BasicBlock>;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.iter.next() {
                Some((_, Some(next))) => return Some(next),
                Some((_, None)) => continue,
                None => return None,
            }
        }
    }
}

pub struct BlocksIter<'b> {
    iter: indexmap::map::Iter<'b, BlockId, Option<Box<BasicBlock>>>,
}

impl<'b> BlocksIter<'b> {
    fn new(iter: indexmap::map::Iter<'b, BlockId, Option<Box<BasicBlock>>>) -> Self {
        Self { iter }
    }
}

impl<'b> Iterator for BlocksIter<'b> {
    type Item = &'b BasicBlock;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        self.iter
            .next()
            .and_then(|(_, block)| block.as_ref())
            .map(|block| block.as_ref())
    }
}

pub struct BlocksIterMut<'b> {
    iter: indexmap::map::IterMut<'b, BlockId, Option<Box<BasicBlock>>>,
}

impl<'b> BlocksIterMut<'b> {
    fn new(iter: indexmap::map::IterMut<'b, BlockId, Option<Box<BasicBlock>>>) -> Self {
        Self { iter }
    }
}

impl<'b> Iterator for BlocksIterMut<'b> {
    type Item = &'b mut BasicBlock;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        self.iter
            .next()
            .and_then(|(_, block)| block.as_mut())
            .map(|block| block.as_mut())
    }
}

pub struct BlockRewriter<'blocks> {
    blocks: &'blocks mut Blocks,
    current: BlockId,
    new_blocks: std::vec::Vec<Box<BasicBlock>>,
}

impl<'blocks> BlockRewriter<'blocks> {
    pub fn new(blocks: &'blocks mut Blocks, entry: BlockId) -> Self {
        Self {
            blocks,
            current: entry,
            new_blocks: Default::default(),
        }
    }

    pub fn each_block<F>(&mut self, mut f: F)
    where
        F: FnMut(Box<BasicBlock>, &mut Self) -> BlockRewriterAction,
    {
        let mut keys = self.blocks.block_ids();
        loop {
            for block_id in keys {
                self.current = block_id;
                let block = self.blocks.data.get_mut(&block_id).unwrap().take().unwrap();
                match f(block, self) {
                    BlockRewriterAction::Keep(block) => {
                        self.blocks.data.insert(block_id, Some(block));
                    }
                    BlockRewriterAction::Remove => {
                        self.blocks.data.remove(&block_id);
                    }
                }
            }
            if !self.new_blocks.is_empty() {
                keys = self.new_blocks.iter().map(|block| block.id).collect();
                for block in self.new_blocks.drain(..) {
                    self.blocks.insert(block);
                }
                continue;
            } else {
                break;
            }
        }
    }

    pub fn try_each_block<F>(&mut self, mut f: F) -> Result<(), Diagnostic>
    where
        F: FnMut(Box<BasicBlock>, &mut Self) -> Result<BlockRewriterAction, Diagnostic>,
    {
        let mut keys = self.blocks.block_ids();
        loop {
            for block_id in keys {
                self.current = block_id;
                let block = self.blocks.data.get_mut(&block_id).unwrap().take().unwrap();
                match f(block, self)? {
                    BlockRewriterAction::Keep(block) => {
                        self.blocks.data.insert(block_id, Some(block));
                    }
                    BlockRewriterAction::Remove => {
                        self.blocks.data.remove(&block_id);
                    }
                }
            }
            if !self.new_blocks.is_empty() {
                keys = self.new_blocks.iter().map(|block| block.id).collect();
                for block in self.new_blocks.drain(..) {
                    self.blocks.insert(block);
                }
                continue;
            } else {
                break;
            }
        }
        Ok(())
    }

    pub fn contains(&self, block_id: BlockId) -> bool {
        assert_ne!(block_id, self.current);
        self.blocks.data.contains_key(&block_id)
    }

    pub fn block(&self, block_id: BlockId) -> &BasicBlock {
        assert_ne!(block_id, self.current);
        self.blocks.block(block_id)
    }

    pub fn block_mut(&mut self, block_id: BlockId) -> &mut BasicBlock {
        assert_ne!(block_id, self.current);
        self.blocks.block_mut(block_id)
    }

    pub fn add_block(&mut self, block: Box<BasicBlock>) {
        self.new_blocks.push(block);
    }
}

pub enum BlockRewriterAction {
    Keep(Box<BasicBlock>),
    Remove,
}
