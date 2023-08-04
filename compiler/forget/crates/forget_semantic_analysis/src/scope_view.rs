use indexmap::IndexMap;

use crate::{Declaration, Label, Reference, Scope, ScopeManager};

pub struct ScopeView<'m> {
    pub(crate) manager: &'m ScopeManager,
    pub(crate) scope: &'m Scope,
}

impl<'m> std::fmt::Debug for ScopeView<'m> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let labels: IndexMap<_, _> = self
            .scope
            .labels
            .iter()
            .map(|(name, label)| {
                (
                    name.clone(),
                    LabelView {
                        manager: &self.manager,
                        label: self.manager.label(*label),
                    },
                )
            })
            .collect();
        let declarations: IndexMap<_, _> = self
            .scope
            .declarations
            .iter()
            .map(|(name, declaration)| {
                (
                    name.clone(),
                    DeclarationView {
                        manager: &self.manager,
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
                manager: &self.manager,
                reference: self.manager.reference(*reference),
            })
            .collect();
        let children: Vec<_> = self
            .scope
            .children
            .iter()
            .map(|child| ScopeView {
                manager: &self.manager,
                scope: self.manager.scope(*child),
            })
            .collect();
        f.debug_struct("Scope")
            .field("id", &self.scope.id)
            .field("kind", &self.scope.kind)
            .field("labels", &labels)
            .field("declarations", &declarations)
            .field("references", &references)
            .field("children", &children)
            .finish()
    }
}

pub struct LabelView<'m> {
    manager: &'m ScopeManager,
    label: &'m Label,
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

pub struct DeclarationView<'m> {
    manager: &'m ScopeManager,
    declaration: &'m Declaration,
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

pub struct ReferenceView<'m> {
    manager: &'m ScopeManager,
    reference: &'m Reference,
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
