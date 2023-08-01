use std::collections::HashSet;

use forget_estree::{Binding, BindingId, Function, Identifier, Visitor};
use forget_hir::Environment;

pub(crate) fn get_context_identifiers<'ast>(
    _env: &Environment,
    function: &'ast Function,
) -> Vec<&'ast Identifier> {
    let mut visitor = ContextVisitor::new();
    visitor.visit_function(function);
    let ContextVisitor {
        free_variables,
        defined,
        ..
    } = visitor;
    free_variables
        .into_iter()
        .filter(|identifier| match &identifier.binding {
            Some(Binding::Local(id)) if !defined.contains(id) => true,
            _ => false,
        })
        .collect()
}

struct ContextVisitor<'ast> {
    free_variables: Vec<&'ast Identifier>,
    defined: HashSet<BindingId>,
    lvalue: bool,
}

impl<'ast> ContextVisitor<'ast> {
    fn new() -> Self {
        Self {
            free_variables: Default::default(),
            defined: Default::default(),
            lvalue: false,
        }
    }
}

impl<'ast> Visitor<'ast> for ContextVisitor<'ast> {
    fn visit_lvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self) -> (),
    {
        let prev_lvalue = self.lvalue;
        self.lvalue = true;
        f(self);
        self.lvalue = prev_lvalue;
    }

    fn visit_identifier(&mut self, identifier: &'ast Identifier) {
        let binding = identifier.binding.unwrap();
        match binding {
            Binding::Local(binding_id) => {
                if self.lvalue {
                    // println!("lvalue {identifier:?}");
                    self.defined.insert(binding_id);
                } else {
                    // println!("rvalue {identifier:?}");
                    self.free_variables.push(identifier);
                }
            }
            _ => {}
        }
    }

    fn visit_literal(&mut self, _literal: &'ast forget_estree::Literal) {
        // no-op
    }
}
