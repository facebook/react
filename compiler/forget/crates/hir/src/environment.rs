use std::cell::Cell;

use bumpalo::Bump;

use crate::{BlockId, Features, IdentifierId, Registry};

/// Stores all the contextual information about the top-level React function being
/// compiled. Environments may not be reused between React functions, but *are*
/// shared between each React function and all its nested function expressions.
#[derive(Debug)]
pub struct Environment<'a> {
    /// The set of enabled compiler features
    pub features: Features,

    /// Definitions for functions, hooks, and types which are used to compile more
    /// precisely
    #[allow(dead_code)]
    registry: Registry,

    /// Arena allocator so that data for compilation can be efficiently allocated
    /// and the memory reclaimed when compilation completes.
    allocator: &'a Bump,

    /// The next available block index
    next_block_id: Cell<BlockId>,

    /// The next available identifier id
    next_identifier_id: Cell<IdentifierId>,
}

impl<'a> Environment<'a> {
    pub fn new(allocator: &'a Bump, features: Features, registry: Registry) -> Self {
        Self {
            allocator,
            features,
            registry,
            next_block_id: Cell::new(BlockId(0)),
            next_identifier_id: Cell::new(IdentifierId(0)),
        }
    }

    /// Allocate a value into the environment's memory arena
    pub fn alloc<T>(&self, value: T) -> &'a mut T {
        self.allocator.alloc(value)
    }

    /// Get the next available block id
    pub fn next_block_id(&self) -> BlockId {
        let id = self.next_block_id.get();
        self.next_block_id.set(id.next());
        id
    }

    /// Get the next available identifier id
    pub fn next_identifier_id(&self) -> IdentifierId {
        let id = self.next_identifier_id.get();
        self.next_identifier_id.set(id.next());
        id
    }
}
