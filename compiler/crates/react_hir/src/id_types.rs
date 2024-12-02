/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::fmt::Display;

/// Unique identifier for a basic block. Values are unique only with respect to
/// a single top-level function, and may be reused across different top-level
/// functions. Notably, ids *are* unique across the basic blocks of a function
/// and its inner function expressions. This makes it easy to inline the contents
/// of a function expression without re-identifying blocks.
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct BlockId(pub(crate) u32);

impl BlockId {
    pub(crate) fn next(self) -> Self {
        Self(self.0 + 1)
    }
}

impl Display for BlockId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("bb{}", self.0))
    }
}

/// Unique identifier for a variable within a program. This is used to distinguish
/// different instances of a variable with the same name in different scopes, or
/// even the same named identifier across reassignments (when in SSA form).
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct IdentifierId(pub(crate) u32);

impl IdentifierId {
    pub(crate) fn next(self) -> Self {
        Self(self.0 + 1)
    }
}

impl Display for IdentifierId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("${}", self.0))
    }
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct TypeVarId(pub(crate) u32);

impl TypeVarId {
    pub(crate) fn next(self) -> Self {
        Self(self.0 + 1)
    }
}

/// Used to globally order the instructions and terminals within the scope
/// of a given HIR value. Instructions and terminals are ordered using
/// reverse postorder iteration of block instructions and their terminals.
///
/// TODO: rename to more clearly indicate that this is for sequencing
/// and to reflect that it is applied to terminals as well
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct InstructionId(pub(crate) u32);

impl Display for InstructionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("[{}]", self.0))
    }
}

pub struct InstructionIdGenerator(u32);

impl InstructionIdGenerator {
    pub fn new() -> Self {
        Self(0)
    }

    pub fn next(&mut self) -> InstructionId {
        let id = self.0;
        self.0 += 1;
        InstructionId(id)
    }
}

/// Uniquely identifies a reactive scope
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct ScopeId(pub(crate) u32);

/// Uniquely identifiers a builtin function type in the type registry
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct FunctionId(pub(crate) u32);

/// Uniquely identifiers a builtin object type in the type registry
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct ObjectId(pub(crate) u32);

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Hash, Debug)]
pub struct InstrIx(pub(crate) u32);

impl InstrIx {
    pub fn new(value: u32) -> Self {
        Self(value)
    }
}

impl From<InstrIx> for usize {
    fn from(value: InstrIx) -> Self {
        value.0 as usize
    }
}

impl Display for InstrIx {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("#{}", self.0))
    }
}
