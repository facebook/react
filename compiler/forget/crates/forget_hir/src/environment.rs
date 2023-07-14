use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use bumpalo::boxed::Box;
use bumpalo::collections::Vec;
use bumpalo::Bump;
use forget_estree::BindingId;

use crate::{
    BlockId, Features, Identifier, IdentifierData, IdentifierId, Registry, Type, TypeVarId,
};

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
    pub allocator: &'a Bump,

    /// The next available block index
    next_block_id: Cell<BlockId>,

    /// The next available identifier id
    next_identifier_id: Cell<IdentifierId>,

    next_type_var_id: Cell<TypeVarId>,

    bindings: Rc<RefCell<HashMap<(bumpalo::collections::String<'a>, BindingId), Identifier<'a>>>>,
}

impl<'a> Environment<'a> {
    pub fn new(allocator: &'a Bump, features: Features, registry: Registry) -> Self {
        Self {
            allocator,
            features,
            registry,
            next_block_id: Cell::new(BlockId(0)),
            next_identifier_id: Cell::new(IdentifierId(0)),
            next_type_var_id: Cell::new(TypeVarId(0)),
            bindings: Default::default(),
        }
    }

    /// Allocate a value into the environment's memory arena
    pub fn alloc<T>(&self, value: T) -> &'a mut T {
        self.allocator.alloc(value)
    }

    pub fn box_new<T>(&self, value: T) -> Box<'a, T> {
        Box::new_in(value, &self.allocator)
    }

    pub fn vec_new<T>(&self) -> Vec<'a, T> {
        Vec::new_in(&self.allocator)
    }

    pub fn vec_with_capacity<T>(&self, capacity: usize) -> Vec<'a, T> {
        Vec::with_capacity_in(capacity, &self.allocator)
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

    /// Get the next available type var
    pub fn next_type_var_id(&self) -> TypeVarId {
        let id = self.next_type_var_id.get();
        self.next_type_var_id.set(id.next());
        id
    }

    pub fn resolve_binding_identifier(&self, name: &str, binding_id: BindingId) -> Identifier<'a> {
        let key_name = bumpalo::collections::String::from_str_in(name, &self.allocator);
        let mut bindings = self.bindings.borrow_mut();
        if let Some(identifier) = bindings.get(&(key_name.clone(), binding_id)) {
            identifier.clone()
        } else {
            let id = self.next_identifier_id();
            let identifier = Identifier {
                id,
                name: Some(key_name.clone()),
                data: Rc::new(RefCell::new(IdentifierData {
                    mutable_range: Default::default(),
                    scope: None,
                    type_: Type::Var(self.next_type_var_id()),
                })),
            };
            bindings.insert((key_name, binding_id), identifier.clone());
            identifier
        }
    }
}
