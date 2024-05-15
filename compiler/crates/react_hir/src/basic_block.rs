/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::fmt::Display;

use indexmap::{IndexMap, IndexSet};

use crate::id_types::BlockId;
use crate::{Identifier, InstrIx, Terminal};

/// Represents a sequence of instructions that will always[1] execute
/// consecutively. Concretely, a block may have zero or more instructions
/// and ends with a terminal node that describes where control flow may
/// continue.
///
/// [1] Assuming no exceptions are thrown.
#[derive(Debug)]
pub struct BasicBlock {
    /// The identifier for the block
    pub id: BlockId,

    /// What kind of block this is. Used to distinguish basic blocks that
    /// correspond to a block scope in the input from basic blocks that
    /// represent control flow within statements or expressions, such as
    /// loops, logicals, ternaries, optionals, or sequences.
    pub kind: BlockKind,

    /// The ordered instructions in this block
    pub instructions: Vec<InstrIx>,

    /// The terminal instruction for the block
    pub terminal: Terminal,

    /// The immediate predecessors of this block
    pub predecessors: IndexSet<BlockId>,

    pub phis: Vec<Phi>,
}

#[derive(Debug)]
pub struct Phi {
    pub identifier: Identifier,
    pub operands: IndexMap<BlockId, Identifier>,
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub enum BlockKind {
    Block,
    Value,
    Loop,
    Sequence,
}

impl Display for BlockKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Block => f.write_str("block"),
            Self::Value => f.write_str("value"),
            Self::Loop => f.write_str("loop"),
            Self::Sequence => f.write_str("sequence"),
        }
    }
}
