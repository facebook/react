/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use react_estree::ESTreeNode;
use react_semantic_analysis::{DeclarationId, ScopeManager, ScopeView};

use crate::{
    BlockId, Features, Identifier, IdentifierData, IdentifierId, MutableRange, Registry, Type,
    TypeVarId,
};

/// Stores all the contextual information about the top-level React function being
/// compiled. Environments may not be reused between React functions, but *are*
/// shared between each React function and all its nested function expressions.
#[derive(Debug)]
pub struct Environment {
    /// The set of enabled compiler features
    pub features: Features,

    /// Definitions for functions, hooks, and types which are used to compile more
    /// precisely
    #[allow(dead_code)]
    registry: Registry,

    /// The next available block index
    next_block_id: Cell<BlockId>,

    /// The next available identifier id
    next_identifier_id: Cell<IdentifierId>,

    analysis: ScopeManager,

    next_type_var_id: Cell<TypeVarId>,

    bindings: Rc<RefCell<HashMap<DeclarationId, Identifier>>>,
}

impl Environment {
    pub fn new(features: Features, registry: Registry, analysis: ScopeManager) -> Self {
        Self {
            features,
            registry,
            analysis,
            next_block_id: Cell::new(BlockId(0)),
            next_identifier_id: Cell::new(IdentifierId(0)),
            next_type_var_id: Cell::new(TypeVarId(0)),
            bindings: Default::default(),
        }
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

    pub fn resolve_variable_declaration<T: ESTreeNode>(
        &self,
        node: &T,
        name: &str,
    ) -> Option<Identifier> {
        let declaration = self.analysis.node_declaration(node)?;
        let mut bindings = self.bindings.borrow_mut();
        if let Some(identifier) = bindings.get(&declaration.id) {
            Some(identifier.clone())
        } else {
            let id = self.next_identifier_id();
            let identifier = Identifier {
                id,
                name: Some(name.to_string()),
                data: Rc::new(RefCell::new(IdentifierData {
                    mutable_range: Default::default(),
                    scope: None,
                    type_: Type::Var(self.next_type_var_id()),
                })),
            };
            bindings.insert(declaration.id, identifier.clone());
            Some(identifier)
        }
    }

    pub fn resolve_variable_reference<T: ESTreeNode>(&self, node: &T) -> Option<Identifier> {
        let reference = self.analysis.node_reference(node)?;
        let bindings = self.bindings.borrow();
        let declaration = self.analysis.declaration(reference.declaration);
        let identifier = bindings.get(&declaration.id)?;
        Some(identifier.clone())
    }

    pub fn resolve_declaration_id(&self, id: DeclarationId) -> Option<Identifier> {
        let bindings = self.bindings.borrow();
        let identifier = bindings.get(&id)?;
        Some(identifier.clone())
    }

    pub fn scope<T: ESTreeNode>(&self, node: &T) -> Option<ScopeView<'_>> {
        self.analysis.node_scope_view(node)
    }

    pub fn new_temporary(&self) -> Identifier {
        Identifier {
            id: self.next_identifier_id(),
            name: None,
            data: Rc::new(RefCell::new(IdentifierData {
                mutable_range: MutableRange::new(),
                scope: None,
                type_: Type::Var(self.next_type_var_id()),
            })),
        }
    }
}
