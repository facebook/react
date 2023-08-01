use std::collections::HashMap;

use forget_estree::{ESTreeNode, Identifier, Program};
use forget_utils::PointerAddress;

pub fn analyze<'ast>(ast: &'ast Program) -> SemanticAnalysis {
    todo!("Actually analyze code")
}

#[derive(Default, Debug)]
pub struct SemanticAnalysis {
    scopes: HashMap<AstNode, Scope>,
    references: HashMap<AstNode, Reference>,
}

impl SemanticAnalysis {
    pub(crate) fn new() -> Self {
        Default::default()
    }

    fn scope<T: ESTreeNode>(&self, node: &T) -> Option<&Scope> {
        self.scopes.get(&node.into())
    }

    fn reference(&self, identifier: &Identifier) -> Option<&Reference> {
        self.references.get(&identifier.into())
    }
}

#[derive(Debug)]
pub struct Scope {}

#[derive(Debug)]
pub struct Reference {}

#[derive(Debug, Hash, PartialEq, Eq, Clone, Copy)]
struct AstNode(PointerAddress);

impl AstNode {
    fn new<T: ESTreeNode>(node: &T) -> Self {
        Self(PointerAddress::new(node))
    }
}

impl<T> From<&T> for AstNode
where
    T: ESTreeNode,
{
    fn from(value: &T) -> Self {
        Self::new(value)
    }
}
