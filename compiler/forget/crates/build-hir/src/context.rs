use std::collections::HashSet;

use estree::{Binding, BindingId, Expression, ExpressionOrSuper, Function, Identifier, Visitor};
use hir::Environment;

pub(crate) fn get_context_identifiers<'a, 'ast>(
    _env: &'a Environment<'a>,
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

    fn visit_function(&mut self, function: &'ast Function) {
        self.visit_lvalue(|visitor| {
            for param in &function.params {
                visitor.visit_pattern(param);
            }
        });
        self.default_visit_function(function);
    }

    fn visit_expression(&mut self, expr: &'ast Expression) {
        if let Expression::AssignmentExpression(expr) = expr {
            self.visit_lvalue(|visitor| visitor.visit_assignment_target(&expr.left));
            self.visit_expression(&expr.right);
            return;
        }
        let mut object = expr;
        while let Expression::MemberExpression(expr) = object {
            match &expr.object {
                ExpressionOrSuper::Super(_) => return,
                ExpressionOrSuper::Expression(expr) => {
                    object = expr;
                }
            }
            if expr.computed {
                self.visit_expression(&expr.property);
            }
        }
        if let Expression::Identifier(identifier) = object {
            self.visit_identifier(identifier);
        } else {
            self.default_visit_expression(expr);
        }
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
}
