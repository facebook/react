/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use indexmap::IndexMap;

use crate::{
    Declaration, DeclarationId, DeclarationKind, Label, Reference, ReferenceId, ReferenceKind,
    Scope, ScopeId, ScopeKind, ScopeManager,
};

#[derive(Clone, Copy)]
pub struct ScopeManagerView<'m> {
    pub(crate) manager: &'m ScopeManager,
}

impl<'m> ScopeManagerView<'m> {
    pub fn root(&self) -> ScopeView<'m> {
        ScopeView {
            manager: self.manager,
            scope: self.manager.scope(self.manager.root_id()),
        }
    }

    pub fn globals(&self) -> impl Iterator<Item = (&String, &DeclarationId)> {
        self.manager.globals()
    }
}

impl<'m> std::fmt::Debug for ScopeManagerView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ScopeManager")
            .field("globals", &self.globals().collect::<Vec<_>>())
            .field("root", &self.root())
            .finish()
    }
}
#[derive(Clone, Copy)]
pub struct ScopeView<'m> {
    pub(crate) manager: &'m ScopeManager,
    pub(crate) scope: &'m Scope,
}

impl<'m> ScopeView<'m> {
    pub fn id(&self) -> ScopeId {
        self.scope.id
    }

    pub fn kind(&self) -> ScopeKind {
        self.scope.kind
    }

    pub fn parent(&self) -> Option<ScopeView<'m>> {
        self.scope.parent.map(|id| {
            let scope = self.manager.scope(id);
            ScopeView {
                manager: self.manager,
                scope,
            }
        })
    }

    pub fn declarations(&self) -> Vec<DeclarationView<'m>> {
        self.scope
            .declarations
            .values()
            .cloned()
            .map(|id| {
                let declaration = self.manager.declaration(id);
                DeclarationView {
                    manager: self.manager,
                    declaration,
                }
            })
            .collect()
    }

    pub fn references(&self) -> Vec<ReferenceView<'m>> {
        self.scope
            .references
            .iter()
            .cloned()
            .map(|id| {
                let reference = self.manager.reference(id);
                ReferenceView {
                    manager: self.manager,
                    reference,
                }
            })
            .collect()
    }

    pub fn children(&self) -> Vec<ScopeView<'m>> {
        self.scope
            .children
            .iter()
            .cloned()
            .map(|id| {
                let scope = self.manager.scope(id);
                ScopeView {
                    manager: self.manager,
                    scope,
                }
            })
            .collect()
    }

    pub fn is_descendant_of(&self, maybe_ancestor: Self) -> bool {
        self.manager
            .is_descendant_of(self.scope.id, maybe_ancestor.scope.id)
    }
}

impl<'m> std::fmt::Debug for ScopeView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let declarations: IndexMap<_, _> = self
            .scope
            .declarations
            .iter()
            .map(|(name, declaration)| {
                (
                    name.clone(),
                    DeclarationView {
                        manager: self.manager,
                        declaration: self.manager.declaration(*declaration),
                    },
                )
            })
            .collect();
        let references: Vec<_> = self
            .scope
            .references
            .iter()
            .map(|reference| ReferenceView {
                manager: self.manager,
                reference: self.manager.reference(*reference),
            })
            .collect();
        let children: Vec<_> = self
            .scope
            .children
            .iter()
            .map(|child| ScopeView {
                manager: self.manager,
                scope: self.manager.scope(*child),
            })
            .collect();
        f.debug_struct("Scope")
            .field("id", &self.scope.id)
            .field("kind", &self.scope.kind)
            .field("declarations", &declarations)
            .field("references", &references)
            .field("children", &children)
            .finish()
    }
}

#[derive(Clone, Copy)]
#[allow(dead_code)]
pub struct LabelView<'m> {
    #[allow(dead_code)]
    pub(crate) manager: &'m ScopeManager,
    pub(crate) label: &'m Label,
}

impl<'m> std::fmt::Debug for LabelView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Label")
            .field("id", &self.label.id)
            .field("kind", &self.label.kind)
            .field("scope", &self.label.scope)
            .finish()
    }
}

#[derive(Clone, Copy)]
pub struct DeclarationView<'m> {
    pub(crate) manager: &'m ScopeManager,
    pub(crate) declaration: &'m Declaration,
}

impl<'m> DeclarationView<'m> {
    pub fn id(&self) -> DeclarationId {
        self.declaration.id
    }

    pub fn name(&self) -> &str {
        &self.declaration.name
    }

    pub fn kind(&self) -> DeclarationKind {
        self.declaration.kind
    }

    pub fn scope(&self) -> ScopeView<'m> {
        let scope = self.manager.scope(self.declaration.scope);
        ScopeView {
            manager: self.manager,
            scope,
        }
    }
}

impl<'m> std::fmt::Debug for DeclarationView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Declaration")
            .field("id", &self.declaration.id)
            .field("kind", &self.declaration.kind)
            .field("scope", &self.declaration.scope)
            .finish()
    }
}

#[derive(Clone, Copy)]
pub struct ReferenceView<'m> {
    pub(crate) manager: &'m ScopeManager,
    pub(crate) reference: &'m Reference,
}

impl<'m> ReferenceView<'m> {
    pub fn id(&self) -> ReferenceId {
        self.reference.id
    }

    pub fn kind(&self) -> ReferenceKind {
        self.reference.kind
    }

    pub fn scope(&self) -> ScopeView<'m> {
        let scope = self.manager.scope(self.reference.scope);
        ScopeView {
            manager: self.manager,
            scope,
        }
    }

    pub fn declaration(&self) -> DeclarationView<'m> {
        let declaration = self.manager.declaration(self.reference.declaration);
        DeclarationView {
            manager: self.manager,
            declaration,
        }
    }
}

impl<'m> std::fmt::Debug for ReferenceView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let declaration = self.manager.declaration(self.reference.declaration);
        f.debug_struct("Reference")
            .field("id", &self.reference.id)
            .field("kind", &self.reference.kind)
            .field("declaration", &self.reference.declaration)
            .field("declaration (name)", &declaration.name)
            .field("scope", &self.reference.scope)
            .finish()
    }
}
